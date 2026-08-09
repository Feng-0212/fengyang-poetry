// ============================================================
// API: 注册（邮箱+密码）
// 预留管理员邮箱（ADMIN_EMAIL）注册时自动继承旧数据（claimLegacy）
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import {
  createUser,
  createSession,
  getUserByEmail,
  hashPassword,
  toPublicUser,
  isAdminEmail,
  claimLegacy,
} from "@/lib/user";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad-request", message: "请求格式错误" }, { status: 400 });
  }
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const name = (body.name || "").trim();

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid-email", message: "邮箱格式不正确" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "weak-password", message: "密码至少 6 位" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "invalid-name", message: "请填写昵称" }, { status: 400 });
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "email-exists", message: "该邮箱已注册，请直接登录" }, { status: 409 });
  }

  const user = await createUser(email, name, hashPassword(password));

  // 管理员邮箱：自动继承历史数据（无 owner 的诗/藏）
  let inherited = { poems: 0, collections: 0 };
  if (isAdminEmail(email)) {
    inherited = await claimLegacy(user.id, user.name);
  }

  const token = await createSession(user.id);
  return NextResponse.json({
    token,
    user: toPublicUser(user),
    inherited,
  });
}
