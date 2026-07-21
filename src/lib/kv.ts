// ============================================================
// 共享 KV（Upstash Redis）助手 + 轻量缓存工具
// 无 Redis 环境（本地 dev）时回退到进程内存，接口一致。
// ============================================================
import { createHash } from "crypto";

type RedisLike = {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown, opts?: { ex?: number }) => Promise<unknown>;
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
  cached = null;
  return cached;
}

/** 内存回退存储（本地 dev / 无 Redis 时） */
const mem = new Map<string, { v: unknown; exp: number }>();

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

/** 稳定短哈希，用于生成缓存键 */
export function hashKey(...parts: string[]): string {
  return createHash("sha256").update(parts.join("\u0001")).digest("hex").slice(0, 24);
}
