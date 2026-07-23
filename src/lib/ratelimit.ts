/**
 * 简单固定窗口限流（基于 Redis）
 * - 每 IP 每 windowMs 最多允许 limit 次请求
 * - 超限返回 429 Too Many Requests
 *
 * 用法：
 *   const ratelimit = createRateLimiter({ limit: 10, windowMs: 60_000 });
 *   const { success, remaining, reset } = await ratelimit.check(ip);
 *   if (!success) return new Response("Too Many Requests", { status: 429, headers: { "Retry-After": String(reset) } });
 */
import { getKv } from "./kv";

export interface RateLimitConfig {
  limit: number;    // 窗口内最大请求数
  windowMs: number; // 窗口时长（毫秒）
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // 窗口重置时间戳（秒）
  total: number;
}

function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

function sec(ms: number): number {
  return Math.ceil((Date.now() + ms) / 1000);
}

export function createRateLimiter(config: RateLimitConfig) {
  const { limit, windowMs } = config;

  async function check(req: Request): Promise<RateLimitResult> {
    const ip = getIp(req);
    const key = `ratelimit:${ip}`;
    const kv = await getKv();

    if (!kv) {
      // Redis 不可用时放行（避免误杀）
      return { success: true, remaining: limit - 1, reset: sec(windowMs), total: limit };
    }

    try {
      const now = Date.now();
      const windowSec = Math.ceil(windowMs / 1000);

      // 原子递增
      const count = await kv.incr(key);
      if (count === 1) {
        // 第一次请求，设置过期
        await kv.expire(key, windowSec);
      }

      const remaining = Math.max(0, limit - count);
      const reset = sec(windowMs - (now % windowMs));

      return { success: count <= limit, remaining, reset, total: limit };
    } catch {
      return { success: true, remaining: limit - 1, reset: sec(windowMs), total: limit };
    }
  }

  return { check };
}

/** 从 Response 头里提取 Retry-After 秒数 */
export function retryAfterHeader(reset: number): string {
  return String(Math.max(0, reset - Math.ceil(Date.now() / 1000)));
}
