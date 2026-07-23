// ============================================================
// API: 备份历史（GET /api/backup/history）
// 返回 Redis 中所有快照日期列表
// Body: { date: string } (optional) → 返回该日期的快照 JSON
// ============================================================
import { NextResponse } from "next/server";
import type { Poem, Collection } from "@/types/poem";

async function getKv() {
  try {
    const mod = await import("@upstash/redis");
    if (mod.Redis) {
      const url =
        process.env.UPSTASH_REDIS_REST_URL ||
        process.env.KV_REST_API_URL ||
        process.env.REDIS_URL ||
        "";
      const token =
        process.env.UPSTASH_REDIS_REST_TOKEN ||
        process.env.KV_REST_API_TOKEN ||
        "";
      if (url) return new mod.Redis({ url, token });
    }
  } catch {}
  return null;
}

function authed(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const url = new URL(req.url);
  if (url.searchParams.get("key") === secret) return true;
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authed(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const kv = await getKv();
  if (!kv) {
    return NextResponse.json({ error: "no kv" }, { status: 500 });
  }

  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date");
    const includeData = url.searchParams.get("data") === "1";

    // 指定日期：返回该日期快照
    if (date) {
      const poems = await kv.get<Poem[]>(`backup:poems:${date}`);
      const collections = await kv.get<Collection[]>(`backup:collections:${date}`);
      if (!poems) {
        return NextResponse.json({ error: "no snapshot for this date" }, { status: 404 });
      }
      const resp: Record<string, unknown> = {
        date,
        poemCount: poems.length,
        collectionCount: (collections || []).length,
      };
      if (includeData) {
        resp.poems = poems;
        resp.collections = collections;
      }
      return NextResponse.json(resp);
    }

    // 无日期参数：返回快照索引列表
    const index = (await kv.get<string[]>("backup:index")) || [];
    const history = await Promise.all(
      index.map(async (d) => {
        const poems = await kv.get<Poem[]>(`backup:poems:${d}`);
        return { date: d, poemCount: poems?.length ?? 0 };
      })
    );

    return NextResponse.json({ history });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "failed" },
      { status: 500 }
    );
  }
}
