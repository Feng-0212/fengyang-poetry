// ============================================================
// 密码门 — 写诗/改诗/删诗操作保护
// 密码仅在服务端验证，前端仅收集用户输入
// 环境变量：POEM_PASSWORD（服务端专用，不会打包到前端）
// ============================================================
"use client";

import { useState, createContext, useContext, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 前端不存储密码，由服务端校验

interface AuthCtx {
  authenticated: boolean;
  requirePassword: (action: (password: string) => void) => void;
}

const AuthContext = createContext<AuthCtx>({
  authenticated: false,
  requirePassword: () => {},
});

export function usePasswordGate() {
  return useContext(AuthContext);
}

export function PasswordProvider({ children }: { children: ReactNode }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<((password: string) => void) | null>(null);
  const [error, setError] = useState("");

  // 每次操作都要求输入密码（不缓存认证状态）
  const requirePassword = useCallback((action: (password: string) => void) => {
    setPendingAction(() => action);
    setShowPrompt(true);
    setError("");
  }, []);

  // 密码校验交给服务端，前端仅传递输入
  const verifyPassword = useCallback((pw: string) => {
    // 将密码传给 pendingAction，由具体操作函数带上 header 发到服务端校验
    setShowPrompt(false);
    const act = pendingAction;
    setPendingAction(null);
    if (act) {
      // 通过闭包传递密码
      (act as (pw: string) => void)(pw);
    }
  }, [pendingAction]);

  const cancel = useCallback(() => {
    setShowPrompt(false);
    setPendingAction(null);
    setError("");
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated: false, requirePassword }}>
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
