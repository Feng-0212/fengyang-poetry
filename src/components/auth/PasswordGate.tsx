// ============================================================
// 登录态 Provider（原 PasswordGate 演进）
// - 挂载时用本地 token 恢复会话（GET /api/auth/me）
// - requirePassword(action)：已登录直接执行；未登录跳转 /login
// - 提供 login/logout 供登录页与导航栏使用
// 兼容旧接口：usePasswordGate() 返回 { authenticated, user, loading, requirePassword, logout }
// ============================================================
"use client";

import {
  useState,
  createContext,
  useContext,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiMe, apiLogout } from "@/lib/api";
import { getStoredUser, setStoredUser, clearSession } from "@/lib/auth";
import type { PublicUser } from "@/types/poem";

interface AuthCtx {
  authenticated: boolean;
  user: PublicUser | null;
  loading: boolean;
  requirePassword: (action: () => void) => void;
  logout: () => Promise<void>;
  setUser: (u: PublicUser) => void;
}

const AuthContext = createContext<AuthCtx>({
  authenticated: false,
  user: null,
  loading: true,
  requirePassword: () => {},
  logout: async () => {},
  setUser: () => {},
});

export function usePasswordGate() {
  return useContext(AuthContext);
}

export function PasswordProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // 挂载时恢复会话：本地有 token 则向服务端确认
  useEffect(() => {
    const cached = getStoredUser();
    if (cached) setUserState(cached);
    apiMe().then((res) => {
      if (res.ok) {
        // 服务器明确返回：登录则缓存，未登录则清理本地会话
        setUserState(res.user);
        if (res.user) setStoredUser(res.user);
        else clearSession();
      }
      // ok=false（网络/5xx 瞬时错误）：会话状态未知，保留本地缓存的用户与 token，避免误登出
      setLoading(false);
    });
  }, []);

  const requirePassword = useCallback(
    (action: () => void) => {
      if (user) {
        action();
        return;
      }
      // 未登录：跳登录页，登录后回到当前页
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.push(`/login${next}`);
    },
    [user, pathname, router]
  );

  const logout = useCallback(async () => {
    await apiLogout();
    clearSession();
    setUserState(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        authenticated: !!user,
        user,
        loading,
        requirePassword,
        logout,
        setUser: setUserState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
