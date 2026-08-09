// ============================================================
// API: 删除评论（DELETE /api/poem/[id]/comments/[cid]）
// 仅本人可删；诗作者可删其诗下评论（管理自己的评论区）
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import type { Poem, PoemComment } from "@/types/poem";
import { requireUser } from "@/lib/user";
import { getPoems, getComments, setComments } from "@/lib/store";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const user = auth.user;

  const { id, cid } = await params;
  const comments = await getComments(id);
  const idx = comments.findIndex((c) => c.id === cid);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const comment = comments[idx];
  const poem = (await getPoems()).find((p) => p.id === id) || null;
  const isPoemOwner = poem?.ownerId === user.id;
  // 仅评论者本人或诗作者可删
  if (comment.userId !== user.id && !isPoemOwner) {
    return NextResponse.json({ error: "forbidden", message: "无权删除该评论" }, { status: 403 });
  }
  comments.splice(idx, 1);
  await setComments(id, comments);
  return NextResponse.json({ ok: true });
}
