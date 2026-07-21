// ============================================================
// 每日一诗 — 首页「今日节气 + 应景一首」
// 按日期确定性选诗（同一天所有访客看到同一首），优先当季。
// ============================================================
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getAllPoems } from "@/lib/api";
import { getSolarTerm } from "@/lib/solarterms";
import type { Poem } from "@/types/poem";

export default function PoemOfTheDay() {
  const [poem, setPoem] = useState<Poem | null>(null);
  const [loading, setLoading] = useState(true);
  const term = getSolarTerm(new Date());

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const all = await getAllPoems();
        if (!alive) return;
        if (all.length === 0) {
          setPoem(null);
          return;
        }
        const now = new Date();
        const seed =
          now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
        // 优先当季诗；无则全部
        const seasonal = all.filter((p) => p.season === term.season);
        const pool = seasonal.length > 0 ? seasonal : all;
        setPoem(pool[seed % pool.length]);
      } catch {
        if (alive) setPoem(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loading && !poem) return null;

  const dateStr = new Date().toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
  });

  const lines =
    poem?.content
      .split(/[，。；！？\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(" · ") || "";

  const authorLine = poem?.author
    ? `${poem.author}${poem.dynasty ? " · " + poem.dynasty : ""}`
    : "佚名";

  return (
    <section className="max-w-4xl mx-auto px-6 mb-14">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        className="relative overflow-hidden rounded-2xl border p-6 md:p-8"
        style={{
          borderColor: `${term.color}22`,
          background: `linear-gradient(135deg, ${term.color}0A 0%, transparent 60%)`,
        }}
      >
        {/* 角标水墨晕染 */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none opacity-20"
          style={{
            background: `radial-gradient(circle, ${term.color}40 0%, transparent 70%)`,
          }}
        />

        <div className="flex items-center gap-2 mb-4 relative z-10">
          <span
            className="text-xs tracking-[0.3em] uppercase px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${term.color}18`, color: term.color }}
          >
            今日一诗
          </span>
          <span className="text-xs text-ink-light">
            {dateStr} · {term.name}
          </span>
        </div>

        {loading || !poem ? (
          <div className="relative z-10">
            <div className="skeleton w-40 h-7 mb-3" />
            <div className="skeleton w-full h-4 mb-2" />
            <div className="skeleton w-2/3 h-4" />
          </div>
        ) : (
          <Link href={`/poem/${poem.id}`} className="block group relative z-10">
            <h2
              className="font-[var(--font-mashan)] text-2xl md:text-3xl text-ink-dark mb-2 group-hover:text-cinnabar transition-colors"
              style={{ fontFamily: "var(--font-mashan)" }}
            >
              《{poem.title}》
            </h2>
            <div className="text-xs text-ink-light mb-4">{authorLine}</div>
            <p className="text-base md:text-lg text-ink leading-loose mb-5">
              {lines}
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm text-cinnabar/90 group-hover:gap-2.5 transition-all">
              品读全诗
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </span>
          </Link>
        )}
      </motion.div>
    </section>
  );
}
