// ============================================================
// API: 收藏切换（POST /api/poem/[id]/favorite）
// 多用户真实收藏：favoritedBy 列表（去重）+ favoriteCount 计数
// 需登录；未登录返回 401
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import type { Poem } from "@/types/poem";
import { requireUser, isPoemVisible } from "@/lib/user";

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

const KV_KEY = "poems:all";

async function getPoems(): Promise<Poem[]> {
  const kv = await getKv();
  if (kv) {
    const data = await kv.get<Poem[]>(KV_KEY);
    return data || [];
  }
  if (!(globalThis as any).__poems) (globalThis as any).__poems = [];
  return (globalThis as any).__poems;
}

async function setPoems(poems: Poem[]): Promise<void> {
  const kv = await getKv();
  if (kv) {
    await kv.set(KV_KEY, poems);
  } else {
    (globalThis as any).__poems = poems;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const user = auth.user;

  const { id } = await params;
  const poems = await getPoems();
  const idx = poems.findIndex((p) => p.id === id);
  if (idx === -1 || poems[idx].deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // 私密诗只有作者可收藏（他人不可见则不可操作）
  if (!isPoemVisible(poems[idx], user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const poem = poems[idx];
  const favs = poem.favoritedBy || [];
  const already = favs.includes(user.id);
  const next = already ? favs.filter((uid) => uid !== user.id) : [...favs, user.id];
  poem.favoritedBy = next;
  poem.favoriteCount = next.length;
  poem.updatedAt = Date.now();
  await setPoems(poems);

  return NextResponse.json({
    favorited: !already,
    favoriteCount: poem.favoriteCount,
  });
}
