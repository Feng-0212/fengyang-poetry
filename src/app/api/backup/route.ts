// ============================================================
// API: 每日数据快照备份（Redis 内快照，防误删/误覆盖）
// 由 Vercel Cron 每日调用；也可用 ?key=<CRON_SECRET> 手动触发。
// 保留最近 30 天快照（TTL），并维护 backup:index 列表。
// 异地容灾：配置 BACKUP_REMOTE_URL 后，快照会同步 POST 到外部端点
// （如自建服务器/对象存储接收器），失败不影响本地快照。
// ============================================================
import { NextResponse } from "next/server";
import { getKv } from "@/lib/kv";
import type { Poem, Collection } from "@/types/poem";

export const runtime = "nodejs";
export const maxDuration = 30;

const TTL = 60 * 60 * 24 * 30; // 30 天
const KEEP = 60; // 索引保留条数

function authed(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // 未配置密钥则不拦截（本地/首次）
  const url = new URL(req.url);
  if (url.searchParams.get("key") === secret) return true;
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}

/**
 * 异地推送：将快照 POST 到 BACKUP_REMOTE_URL（可选异地容灾通道）。
 * - 未配置 BACKUP_REMOTE_URL → 返回 "skipped"
 * - 配置了但推送失败 → 返回 "failed"（不影响本地快照）
 * - 成功 → 返回 "ok"
 */
async function pushRemote(
  payload: { date: string; poems: Poem[]; collections: Collection[] }
): Promise<"ok" | "skipped" | "failed"> {
  const remoteUrl = process.env.BACKUP_REMOTE_URL || "";
  if (!remoteUrl) return "skipped";
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = process.env.BACKUP_REMOTE_TOKEN || "";
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const resp = await fetch(remoteUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
    return resp.ok ? "ok" : "failed";
  } catch {
    return "failed";
  }
}

export async function GET(req: Request) {
  if (!authed(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const kv = await getKv();
  if (!kv) {
    return NextResponse.json({ error: "no kv configured" }, { status: 500 });
  }
  try {
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const poems = (await kv.get<Poem[]>("poems:all")) || [];
    const collections = (await kv.get<Collection[]>("collections:all")) || [];

    await kv.set(`backup:poems:${date}`, poems, { ex: TTL });
    await kv.set(`backup:collections:${date}`, collections, { ex: TTL });

    // 维护索引
    const index = (await kv.get<string[]>("backup:index")) || [];
    if (!index.includes(date)) index.unshift(date);
    const trimmed = index.slice(0, KEEP);
    await kv.set("backup:index", trimmed);

    // 异地容灾推送（可选，失败不阻断）
    const remote = await pushRemote({ date, poems, collections });

    return NextResponse.json({
      ok: true,
      date,
      poems: poems.length,
      collections: collections.length,
      snapshots: trimmed.length,
      remote,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "backup failed: " + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
