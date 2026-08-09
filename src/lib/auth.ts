// ============================================================
// 客户端会话工具（token + 用户信息存取）
// 服务端鉴权见 src/lib/user.ts（密码哈希/session/requireUser）
// ============================================================
import type { PublicUser } from "@/types/poem";

export const TOKEN_KEY = "poem_token";
export const USER_KEY = "poem_user";

// ---------- token ----------
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// ---------- 用户信息缓存 ----------
export function getStoredUser(): PublicUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as PublicUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: PublicUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
}

export function clearSession(): void {
  clearToken();
  clearStoredUser();
}

// ---------- 兼容旧版密码存储（已弃用，保留空实现避免破坏引用） ----------
export const PASSWORD_KEY = "poem_password";
export function getStoredPassword(): string | null {
  return null;
}
export function setStoredPassword(_pw: string): void {}
export function clearStoredPassword(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PASSWORD_KEY);
}
