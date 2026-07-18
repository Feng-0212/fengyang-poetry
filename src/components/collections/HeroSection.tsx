// ============================================================
// 四时墨苑 - 墨韵阁 Hero 区域
// ============================================================
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* 背景水墨晕染 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(193,74,63,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        {/* 墨韵阁题字 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="mb-4"
        >
          <span
            className="inline-block text-sm tracking-[0.4em] text-ink-light/60 uppercase"
          >
            藏 · 阁
          </span>
        </motion.div>

        {/* 主标题 */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 30 }}
          transition={{
            delay: 0.15,
            duration: 1.0,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="font-[var(--font-mashan)] text-5xl md:text-7xl text-ink-dark mb-6 tracking-wide"
          style={{ fontFamily: "var(--font-mashan)" }}
        >
          墨韵阁
        </motion.h1>

        {/* 副标题 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
          transition={{
            delay: 0.35,
            duration: 0.8,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="text-ink-light text-lg md:text-xl mb-12 leading-relaxed max-w-xl mx-auto"
        >
          一座随节气流转的私人藏书楼
          <br />
          <span className="text-sm text-ink-light/60">
            六藏并行，各抱地势，墨韵悠长
          </span>
        </motion.p>

        {/* 装饰线 */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: mounted ? 1 : 0, opacity: mounted ? 1 : 0 }}
          transition={{ delay: 0.55, duration: 0.8 }}
          className="h-px max-w-xs mx-auto mb-12"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(193,74,63,0.3), transparent)",
          }}
        />

        {/* 进入按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/yuan/sishi-moyuan"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm transition-all"
            style={{
              backgroundColor: "#C14A3F",
              color: "white",
            }}
          >
            <span>墨</span>
            <span>进入四时墨苑</span>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>

          <Link
            href="/yuan/new"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm border transition-all hover:bg-ink/5"
            style={{ borderColor: "rgba(26,26,26,0.2)", color: "rgba(26,26,26,0.6)" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>创建新藏</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
