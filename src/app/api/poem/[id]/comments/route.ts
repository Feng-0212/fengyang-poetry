// ============================================================
// API: 评论（/api/poem/[id]/comments）
// GET  → 评论列表（公开；私密诗 404）
// POST → 发表评论（需登录，≤500 字）
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import type { Poem, PoemComment } from "@/types/poem";
import { requireUser, optionalUser, isPoemVisible } from "@/lib/user";
import { getPoems, getComments, setComments } from "@/lib/store";

const MAX_COMMENT_LEN = 500;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const poem = (await getPoems()).find((p) => p.id === id) || null;
  if (!poem || poem.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const user = await optionalUser(req);
  if (!isPoemVisible(poem, user?.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const comments = await getComments(id);
  // 按时间正序展示
  comments.sort((a, b) => a.createdAt - b.createdAt);
  return NextResponse.json({ comments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const user = auth.user;

  const { id } = await params;
  const poem = (await getPoems()).find((p) => p.id === id) || null;
  if (!poem || poem.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isPoemVisible(poem, user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad-request", message: "请求格式错误" }, { status: 400 });
  }
  const content = (body.content || "").trim();
  if (!content) {
    return NextResponse.json({ error: "invalid-input", message: "评论内容不能为空" }, { status: 400 });
  }
  if (content.length > MAX_COMMENT_LEN) {
    return NextResponse.json({ error: "too-long", message: `评论最多 ${MAX_COMMENT_LEN} 字` }, { status: 400 });
  }

  const comment: PoemComment = {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    poemId: id,
    userId: user.id,
    userName: user.name,
    content,
    createdAt: Date.now(),
  };
  const comments = await getComments(id);
  comments.push(comment);
  await setComments(id, comments);

  return NextResponse.json({ comment }, { status: 201 });
}
