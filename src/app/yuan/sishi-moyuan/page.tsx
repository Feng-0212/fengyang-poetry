// ============================================================
// 四时墨苑 - 四时墨苑专属页（/yuan/sishi-moyuan）
// ============================================================
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AtmosphereLayer from "@/components/poem/AtmosphereLayer";
import PoemCard from "@/components/poem/PoemCard";
import SolarTermNav from "@/components/poem/SolarTermNav";
import { useSolarTerm } from "@/hooks/useSolarTerm";
import { usePoems, useSeasonPoems } from "@/hooks/usePoem";
import { motion } from "framer-motion";
import { COLLECTION_IDS, type Collection } from "@/types/poem";
import { getCollectionBySlug } from "@/lib/db";
import type { SeasonKey } from "@/types/poem";

const SEASON_LABELS: Record<string, string> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
};

const SEASON_ICONS: Record<string, string> = {
  spring: "🌸",
  summer: "☀️",
  autumn: "🍂",
  winter: "❄️",
};

export default function SishiMoyuanPage() {
  const solarTerm = useSolarTerm();
  const [activeSeason, setActiveSeason] = useState<string>("all");
  const [colId, setColId] = useState<string | undefined>(undefined);
  const [sishiMoyuan, setSishiMoyuan] = useState<Collection | null>(null);

  // 获取四时墨苑的真实数据库 ID（而非 slug）
  useEffect(() => {
    getCollectionBySlug(COLLECTION_IDS.SISHI_MOYUAN).then((c) => {
      if (c) {
        setColId(c.id);
        setSishiMoyuan(c);
      }
    });
  }, []);

  const { poems, loading } = usePoems(colId);
  const { poems: springPoems } = useSeasonPoems("spring", colId);
  const { poems: summerPoems } = useSeasonPoems("summer", colId);
  const { poems: autumnPoems } = useSeasonPoems("autumn", colId);
  const { poems: winterPoems } = useSeasonPoems("winter", colId);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const filteredPoems =
    activeSeason === "all"
      ? poems
      : poems.filter((p) => p.season === activeSeason);

  const seasonCounts = {
    spring: springPoems.length,
    summer: summerPoems.length,
    autumn: autumnPoems.length,
    winter: winterPoems.length,
  };

  return (
    <div className="paper-texture min-h-screen flex flex-col">
      <AtmosphereLayer solarTerm={solarTerm} />
      <Navbar />

      <main className="flex-1 page-container relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          {/* Hero 区域 */}
          <section className="py-14 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
              transition={{ duration: 0.7 }}
            >
              {/* 印章 */}
              <div
                className="mx-auto mb-4"
                style={{ filter: `drop-shadow(0 4px 12px ${solarTerm.color}30)` }}
              >
                <svg viewBox="0 0 100 100" width="64" height="64">
                  <rect x="5" y="5" width="90" height="90" rx="3" fill={solarTerm.color} />
                  <rect x="9" y="9" width="82" height="82" rx="2" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
                  <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="44" fontWeight="900" fontFamily="serif">
                    {solarTerm.name[0]}
                  </text>
                </svg>
              </div>

              <h1
                className="text-3xl md:text-4xl text-ink-dark mb-2"
                style={{ fontFamily: "var(--font-mashan)" }}
              >
                四时墨苑
              </h1>
              <p className="text-ink-light text-sm mb-1">
                节令二十四 · 诗词收藏
              </p>
              <p className="text-xs mb-6" style={{ color: solarTerm.color }}>
                {solarTerm.name} · {solarTerm.imagery}
              </p>

              {/* 快捷入口 */}
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/yuan/sishi-moyuan/write"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm text-white transition-all"
                  style={{ backgroundColor: solarTerm.color }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  落笔写诗
                </Link>
                <Link
                  href="/yuan/sishi-moyuan/seasons"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm border transition-all hover:bg-ink/5"
                  style={{ borderColor: `${solarTerm.color}40`, color: "rgba(26,26,26,0.6)" }}
                >
                  游览节气诗库
                </Link>
              </div>
            </motion.div>

            {/* 统计数据 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex justify-center gap-8 mt-8 mb-10"
            >
              {(["spring", "summer", "autumn", "winter"] as const).map((s) => (
                <div key={s} className="text-center">
                  <div className="text-lg mb-0.5">{SEASON_ICONS[s]}</div>
                  <div className="text-xs text-ink-light/60">{SEASON_LABELS[s]}</div>
                  <div className="text-sm font-medium text-ink-dark">
                    {seasonCounts[s]}
                  </div>
                </div>
              ))}
            </motion.div>
          </section>

          {/* 节气导航（24节气圆点） */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: mounted ? 1 : 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <SolarTermNav />
          </motion.div>

          {/* 季节筛选 */}
          <div className="flex items-center gap-2 mb-6">
            {([
              { key: "all", label: "全部" },
              { key: "spring", label: "春" },
              { key: "summer", label: "夏" },
              { key: "autumn", label: "秋" },
              { key: "winter", label: "冬" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSeason(tab.key)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${
                  activeSeason === tab.key
                    ? "text-white"
                    : "text-ink-light hover:bg-ink/5"
                }`}
                style={activeSeason === tab.key ? { backgroundColor: solarTerm.color } : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 诗词网格 */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-20">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton rounded-xl h-44" />
              ))}
            </div>
          ) : filteredPoems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-ink-light/40 mb-3">
                {activeSeason === "all"
                  ? "藏中暂无诗词"
                  : `${SEASON_LABELS[activeSeason]}季暂无诗词`}
              </p>
              <Link
                href="/yuan/sishi-moyuan/write"
                className="text-sm text-cinnabar hover:underline"
              >
                落笔写一首 →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-20">
              {filteredPoems.map((poem, i) => (
                <PoemCard key={poem.id} poem={poem} index={i} collection={sishiMoyuan} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
