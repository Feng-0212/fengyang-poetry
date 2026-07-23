// ============================================================
// 共享 KV（Upstash Redis）助手 + 轻量缓存工具
// 无 Redis 环境（本地 dev）时回退到进程内存，接口一致。
// ============================================================
import { createHash } from "crypto";

type RedisLike = {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown, opts?: { ex?: number }) => Promise<unknown>;
  /** 原子递增（不存在则视为 0 后 +1），返回操作后的值 */
  incr: (key: string) => Promise<number>;
  /** 设置 key 过期时间（秒） */
  expire: (key: string, seconds: number) => Promise<unknown>;
};

let cached: RedisLike | null | undefined;

export async function getKv(): Promise<RedisLike | null> {
  if (cached !== undefined) return cached;
  try {
    const mod = await import("@upstash/redis");
    const url =
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.KV_REST_API_URL ||
      process.env.REDIS_URL ||
      "";
    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN ||
      process.env.KV_REST_API_TOKEN ||
      "";
    if (mod.Redis && url) {
      cached = new mod.Redis({ url, token }) as unknown as RedisLike;
      return cached;
    }
  } catch {
    /* ignore */
  }
  // 无 Redis 时返回完整内存回退（含 incr / expire，供限流等场景使用）
  const fallback: RedisLike = {
    async get<T>(key: string): Promise<T | null> {
      const hit = mem.get(key);
      if (!hit) return null;
      if (hit.exp && hit.exp < Date.now()) { mem.delete(key); return null; }
      return hit.v as T;
    },
    async set(key: string, value: unknown, opts?: { ex?: number }): Promise<unknown> {
      mem.set(key, { v: value, exp: opts?.ex ? Date.now() + opts.ex * 1000 : 0 });
      return "OK";
    },
    async incr(key: string): Promise<number> {
      const cur = counters.get(key) ?? 0;
      counters.set(key, cur + 1);
      return cur + 1;
    },
    async expire(key: string, seconds: number): Promise<unknown> {
      const hit = mem.get(key);
      mem.set(key, { v: hit?.v ?? null, exp: Date.now() + seconds * 1000 });
      return 1;
    },
  };
  cached = fallback;
  return cached;
}

/** 内存回退存储（本地 dev / 无 Redis 时） */
const mem = new Map<string, { v: unknown; exp: number }>();

// 内存 incr 计数器（与 mem 共用同一份存储）
const counters = new Map<string, number>();

export async function cacheGet<T>(key: string): Promise<T | null> {
  const kv = await getKv();
  if (kv) {
    try {
      return await kv.get<T>(key);
    } catch {
      return null;
    }
  }
  const hit = mem.get(key);
  if (!hit) return null;
  if (hit.exp && hit.exp < Date.now()) {
    mem.delete(key);
    return null;
  }
  return hit.v as T;
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<void> {
  const kv = await getKv();
  if (kv) {
    try {
      await kv.set(key, value, ttlSeconds ? { ex: ttlSeconds } : undefined);
    } catch {
      /* ignore */
    }
    return;
  }
  mem.set(key, {
    v: value,
    exp: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0,
  });
}

/** 原子递增（内存版） */
export async function memIncr(key: string): Promise<number> {
  const cur = counters.get(key) ?? 0;
  const next = cur + 1;
  counters.set(key, next);
  return next;
}

/** 设置过期（内存版） */
export async function memExpire(key: string, seconds: number): Promise<void> {
  const existing = mem.get(key);
  mem.set(key, { v: existing?.v ?? null, exp: Date.now() + seconds * 1000 });
}

/** 稳定短哈希，用于生成缓存键 */
export function hashKey(...parts: string[]): string {
  return createHash("sha256").update(parts.join("\u0001")).digest("hex").slice(0, 24);
}
