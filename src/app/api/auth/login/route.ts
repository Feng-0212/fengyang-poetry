// ============================================================
// API: 登录（邮箱+密码）→ 返回 Bearer token
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  getUserByEmail,
  toPublicUser,
  verifyPassword,
} from "@/lib/user";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad-request", message: "请求格式错误" }, { status: 400 });
  }
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json({ error: "invalid-input", message: "请输入邮箱和密码" }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { error: "invalid-credentials", message: "邮箱或密码错误" },
      { status: 401 }
    );
  }

  const token = await createSession(user.id);
  return NextResponse.json({ token, user: toPublicUser(user) });
}
