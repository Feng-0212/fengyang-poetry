// ============================================================
// API: 关注（/api/user/[id]/follow）
// GET  → 查询关注状态（未登录也可查，返回粉丝数）
// POST → 切换关注（需登录；不能关注自己；返回 { following, followersCount }）
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { requireUser, optionalUser, toggleFollow, getUserById, getFollows, getFollowers } from "@/lib/user";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const target = await getUserById(id);
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const user = await optionalUser(req);
  const followers = await getFollowers(id);
  const follows = user ? await getFollows(user.id) : [];
  return NextResponse.json({
    following: user ? follows.includes(id) : false,
    followersCount: followers.length,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const user = auth.user;

  const { id } = await params;
  if (id === user.id) {
    return NextResponse.json({ error: "bad-request", message: "不能关注自己" }, { status: 400 });
  }
  const target = await getUserById(id);
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const res = await toggleFollow(user.id, id);
  return NextResponse.json(res);
}
