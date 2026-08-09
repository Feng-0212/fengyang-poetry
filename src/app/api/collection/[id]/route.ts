// ============================================================
// API: 藏操作（DELETE 整个藏及其诗词）
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import type { Poem, Collection } from "@/types/poem";
import { requireUser, canModifyCollection } from "@/lib/user";
import { getPoems, setPoems, getCollections, setCollections } from "@/lib/store";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 登录校验 + 归属校验
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const user = auth.user;

  const { id } = await params;
  const cols = await getCollections();
  const col = cols.find((c) => c.id === id);
  if (!col) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canModifyCollection(col, user)) {
    return NextResponse.json({ error: "forbidden", message: "无权删除他人的藏" }, { status: 403 });
  }

  // 删除该藏下所有诗词
  let poems = await getPoems();
  const before = poems.length;
  poems = poems.filter((p) => p.collectionId !== id || p.ownerId !== user.id);
  const deleted = before - poems.length;
  await setPoems(poems);

  // 删除藏本身
  const newCols = cols.filter((c) => c.id !== id);
  await setCollections(newCols);

  return NextResponse.json({ ok: true, deleted, removedCollection: newCols.length !== cols.length });
}
