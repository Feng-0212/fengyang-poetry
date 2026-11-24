// ============================================================
// API: 每日一诗（GET /api/daily-poem）
// 代理诗藏 /api/daily（按日期确定性选诗，当天全网同一首）
// 结果按天缓存（24h），诗藏离线时返回 504，首页回退用户作品
// ============================================================
import { NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/kv";

const SHICANG_BASE = process.env.SHICANG_BASE || "https://shicang.poeagent.top";

export const dynamic = "force-dynamic";

export async function GET() {
  const date = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
  const key = `daily-poem:${date}`;
  const hit = await cacheGet<Record<string, unknown>>(key);
  if (hit) return NextResponse.json(hit);
  try {
    const res = await fetch(`${SHICANG_BASE}/api/daily`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "upstream" }, { status: 502 });
    }
    const data = await res.json();
    // 缓存到当天 24 点（东八区）前后约 24h，次日新 key 自然失效
    await cacheSet(key, data, 86400);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "unreachable" }, { status: 504 });
  }
}
