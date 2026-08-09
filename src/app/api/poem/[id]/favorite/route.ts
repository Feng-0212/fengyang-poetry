// ============================================================
// API: 收藏切换（POST /api/poem/[id]/favorite）
// 多用户真实收藏：favoritedBy 列表（去重）+ favoriteCount 计数
// 需登录；未登录返回 401
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import type { Poem } from "@/types/poem";
import { requireUser, isPoemVisible } from "@/lib/user";
import { getPoems, setPoems } from "@/lib/store";

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
