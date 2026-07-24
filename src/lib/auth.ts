// ============================================================
// 服务端鉴权工具（密码校验）
// ============================================================
import { NextRequest, NextResponse } from "next/server";

/**
 * 校验请求是否携带正确密码
 * - 密码从环境变量 POEM_PASSWORD 或 NEXT_PUBLIC_POEM_PASSWORD 读取
 * - 前端通过 x-poem-password header 传递
 * - 校验失败返回 401 { error: "unauthorized", message: "密码错误或未提供" }
 * - 校验成功返回 null（调用方继续执行业务逻辑）
 */
export function checkPassword(req: NextRequest): NextResponse | null {
  const expected = process.env.POEM_PASSWORD || process.env.NEXT_PUBLIC_POEM_PASSWORD || "";
  // 允许从 header 或 body 里的 password 字段读取（兼容旧版前端）
  const fromHeader = req.headers.get("x-poem-password") || "";
  const fromQuery = new URL(req.url).searchParams.get("password") || "";
  const provided = fromHeader || fromQuery;

  if (!expected || provided === expected) {
    return null; // 通过
  }

  return NextResponse.json(
    { error: "unauthorized", message: "密码错误或未提供" },
    { status: 401 }
  );
}

/**
 * 客户端密码存储（localStorage）
 * - 存一次，后续自动带上 header
 */
export const PASSWORD_KEY = "poem_password";

export function getStoredPassword(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PASSWORD_KEY);
}

export function setStoredPassword(pw: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PASSWORD_KEY, pw);
}

export function clearStoredPassword(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PASSWORD_KEY);
}
