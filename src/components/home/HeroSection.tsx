// ============================================================
// 四时墨苑 - 首页英雄区
// ============================================================
"use client";

import { motion } from "framer-motion";
import { useSolarTerm } from "@/hooks/useSolarTerm";
import { getSeasonName } from "@/lib/solarterms";
import Link from "next/link";

const SEASONS = [
  { key: "spring", label: "春", emoji: "🌸" },
  { key: "summer", label: "夏", emoji: "🍃" },
  { key: "autumn", label: "秋", emoji: "🍂" },
  { key: "winter", label: "冬", emoji: "❄️" },
] as const;

export default function HeroSection() {
  const solarTerm = useSolarTerm();
  const seasonName = getSeasonName(solarTerm.season);

  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 py-20 overflow-hidden">
      {/* 背景装饰 - 水墨晕染 */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${solarTerm.color}40 0%, transparent 60%)`,
        }}
      />

      {/* 浮动水墨装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[10%] w-32 h-32 rounded-full opacity-5"
          style={{ backgroundColor: solarTerm.color }}
        />
        <motion.div
          animate={{ y: [0, 10, 0], rotate: [0, -4, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-[15%] w-24 h-24 rounded-full opacity-5"
          style={{ backgroundColor: solarTerm.color }}
        />
      </div>

      {/* 主标题 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="text-center relative z-10"
      >
        {/* 当前节气印章 */}
        <motion.div
          key={solarTerm.key}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="inline-flex items-center gap-3 mb-8"
        >
          <div
            className="seal-stamp seal-stamp-large"
            style={{ backgroundColor: solarTerm.color }}
          >
            {solarTerm.name}
          </div>
        </motion.div>

        {/* 主标题 */}
        <h1 className="font-[var(--font-mashan)] text-5xl md:text-7xl text-ink-dark mb-4 tracking-wide">
          四时墨苑
        </h1>

        {/* 副标题 */}
        <p className="text-ink-light text-lg md:text-xl font-light tracking-widest mb-2">
          四时有墨 · 苑藏诗意
        </p>

        {/* 节气描述 */}
        <motion.p
          key={solarTerm.key + "-desc"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-ink-light/70 max-w-md mx-auto mb-12 italic"
        >
          {solarTerm.imagery} · {solarTerm.dateRange}
        </motion.p>

        {/* 四季导航 */}
        <div className="flex items-center justify-center gap-6 mb-12">
          {SEASONS.map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <Link
                href={`/seasons?season=${s.key}`}
                className={`
                  flex flex-col items-center gap-1 px-4 py-3 rounded-lg
                  transition-all duration-300 group
                  ${
                    solarTerm.season === s.key
                      ? "scale-110"
                      : "hover:bg-ink/5"
                  }
                `}
              >
                <span className="text-2xl">{s.emoji}</span>
                <span
                  className={`
                    text-xs tracking-wider transition-colors
                    ${
                      solarTerm.season === s.key
                        ? "text-ink-dark font-medium"
                        : "text-ink-light group-hover:text-ink"
                    }
                  `}
                >
                  {s.label}
                </span>
                {/* 当前季节高亮条 */}
                {solarTerm.season === s.key && (
                  <motion.div
                    layoutId="season-indicator"
                    className="w-4 h-0.5 rounded-full mt-1"
                    style={{ backgroundColor: solarTerm.color }}
                  />
                )}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA 按钮 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-4"
        >
          <Link
            href="/write"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300"
            style={{
              backgroundColor: solarTerm.color,
              color: "white",
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            提笔写诗
          </Link>
          <Link
            href="/seasons"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium border border-ink/20 text-ink transition-all duration-300 hover:border-ink/40 hover:bg-ink/5"
          >
            游览诗库
          </Link>
        </motion.div>
      </motion.div>

      {/* 向下滚动提示 */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-ink-light/40"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </motion.div>
    </section>
  );
}
