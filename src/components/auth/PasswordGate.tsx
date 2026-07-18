// ============================================================
// 密码门 — 写诗/改诗/删诗操作保护
// 优先从环境变量 NEXT_PUBLIC_POEM_PASSWORD 读取
// （避免明文出现在 Git 仓库中，请勿提交 .env.local）
// fallback：环境变量未设时使用默认 zsklj
// ============================================================
"use client";

import { useState, createContext, useContext, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PASSWORD = process.env.NEXT_PUBLIC_POEM_PASSWORD || "zsklj";

interface AuthCtx {
  authenticated: boolean;
  requirePassword: (action: () => void) => void;
}

const AuthContext = createContext<AuthCtx>({
  authenticated: false,
  requirePassword: () => {},
});

export function usePasswordGate() {
  return useContext(AuthContext);
}

export function PasswordProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [error, setError] = useState("");

  const requirePassword = useCallback((action: () => void) => {
    if (authenticated) {
      action();
    } else {
      setPendingAction(() => action);
      setShowPrompt(true);
      setError("");
    }
  }, [authenticated]);

  const verifyPassword = useCallback((pw: string) => {
    if (pw === PASSWORD) {
      setAuthenticated(true);
      setShowPrompt(false);
      if (pendingAction) {
        setTimeout(() => pendingAction(), 100);
        setPendingAction(null);
      }
      return true;
    }
    setError("密码错误");
    return false;
  }, [pendingAction]);

  const cancel = useCallback(() => {
    setShowPrompt(false);
    setPendingAction(null);
    setError("");
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, requirePassword }}>
      {children}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={cancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-8 shadow-2xl max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-[var(--font-mashan)] text-xl text-ink-dark text-center mb-2">
                授权操作
              </h3>
              <p className="text-sm text-ink-light text-center mb-6">
                请输入管理密码
              </p>
              <input
                type="password"
                autoFocus
                placeholder="输入密码..."
                className="w-full px-4 py-2.5 rounded-lg border border-ink/15 text-ink-dark text-sm outline-none focus:border-cinnabar/40 transition-colors mb-3"
                onKeyDown={(e) => {
                  if (e.key === "Enter") verifyPassword((e.target as HTMLInputElement).value);
                  if (e.key === "Escape") cancel();
                }}
                onChange={() => setError("")}
              />
              {error && (
                <p className="text-xs text-red-500 text-center mb-3">{error}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={cancel}
                  className="flex-1 py-2.5 rounded-lg text-sm border border-ink/15 text-ink-light hover:text-ink transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    const input = document.querySelector<HTMLInputElement>('input[type="password"]');
                    if (input) verifyPassword(input.value);
                  }}
                  className="flex-1 py-2.5 rounded-lg text-sm text-white transition-all"
                  style={{ backgroundColor: "#C14A3F" }}
                >
                  确认
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
}
