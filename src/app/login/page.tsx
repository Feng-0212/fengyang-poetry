// ============================================================
// 登录 / 注册页（/login）
// 邮箱+密码；注册后自动登录；?next= 参数登录后跳回
// ============================================================
"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiLogin, apiRegister } from "@/lib/api";
import { setToken, setStoredUser } from "@/lib/auth";
import { usePasswordGate } from "@/components/auth/PasswordGate";
import SealStamp from "@/components/seals/SealStamp";
import { m as motion } from "framer-motion";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = usePasswordGate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError("");
    setInfo("");
    if (!email.trim() || !password) {
      setError("请输入邮箱和密码");
      return;
    }
    if (mode === "register" && password.length < 6) {
      setError("密码至少 6 位");
      return;
    }
    if (mode === "register" && !name.trim()) {
      setError("请填写昵称");
      return;
    }
    setSubmitting(true);
    try {
      const res =
        mode === "login"
          ? await apiLogin(email, password)
          : await apiRegister(email, password, name.trim());
      setToken(res.token);
      setStoredUser(res.user);
      setUser(res.user);
      if (mode === "register" && res.inherited && (res.inherited.poems || res.inherited.collections)) {
        setInfo(`欢迎归来！已继承历史诗库（${res.inherited.poems} 首 / ${res.inherited.collections} 个藏）`);
        setTimeout(() => {
          const next = searchParams.get("next");
          router.push(next || "/");
        }, 1200);
        return;
      }
      const next = searchParams.get("next");
      router.push(next || "/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="paper-texture min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SealStamp term="墨" size="lg" color="#C14A3F" animated={false} />
          </div>
          <h1 className="font-[var(--font-mashan)] text-3xl text-ink-dark mb-1">
            {mode === "login" ? "入苑" : "开苑"}
          </h1>
          <p className="text-sm text-ink-light">
            {mode === "login" ? "登堂入室，续写墨缘" : "注册账号，开一座自己的墨苑"}
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur rounded-2xl border border-ink/10 shadow-ink p-8">
          {/* 模式切换 */}
          <div className="flex rounded-full bg-ink/5 p-1 mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 rounded-full text-sm transition-all ${
                  mode === m ? "bg-white shadow text-ink-dark font-medium" : "text-ink-light"
                }`}
              >
                {m === "login" ? "登录" : "注册"}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <div className="mb-4">
              <label className="block text-xs text-ink-light mb-1.5">昵称</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="你的笔名"
                className="w-full px-4 py-2.5 rounded-lg border border-ink/15 text-sm outline-none focus:border-cinnabar/40 transition-colors"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs text-ink-light mb-1.5">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-lg border border-ink/15 text-sm outline-none focus:border-cinnabar/40 transition-colors"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs text-ink-light mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={mode === "register" ? "至少 6 位" : "输入密码"}
              className="w-full px-4 py-2.5 rounded-lg border border-ink/15 text-sm outline-none focus:border-cinnabar/40 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center mb-3">{error}</p>
          )}
          {info && (
            <p className="text-xs text-cinnabar text-center mb-3">{info}</p>
          )}

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full py-3 rounded-lg text-sm text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: "#C14A3F" }}
          >
            {submitting ? "请稍候..." : mode === "login" ? "登 录" : "注 册"}
          </button>

          <p className="text-xs text-ink-light/60 text-center mt-5 leading-relaxed">
            公开书院 · 所有作品公开展示
            <br />
            私密作品仅自己可见
          </p>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-ink-light hover:text-cinnabar transition-colors">
            ← 回墨韵阁
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="paper-texture min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
