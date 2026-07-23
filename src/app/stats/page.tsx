// ============================================================
// 数据统计页面 - 写作热力图 + 标签词云
// ============================================================
"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getAllPoems } from "@/lib/api";
import type { Poem } from "@/types/poem";
import { motion } from "framer-motion";

export default function StatsPage() {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllPoems();
        setPoems(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 写作热力图数据（最近 365 天）
  const heatmapData = useMemo(() => {
    const today = new Date();
    const days: Record<string, number> = {};
    
    // 初始化最近 365 天
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = 0;
    }

    // 统计每天写诗数量
    poems.forEach((p: any) => {
      const key = typeof p.createdAt === "string" ? p.createdAt.slice(0, 10) : "";
      if (key && days[key] !== undefined) {
        days[key]++;
      }
    });

    return days;
  }, [poems]);

  // 标签统计
  const tagStats = useMemo(() => {
    const counts: Record<string, number> = {};
    poems.forEach((p) => {
      (p.tags || []).forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
  }, [poems]);

  // 藏统计
  const collectionStats = useMemo(() => {
    const counts: Record<string, number> = {};
    poems.forEach((p) => {
      const cid = p.collectionId || "unknown";
      counts[cid] = (counts[cid] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [poems]);

  // 季节统计
  const seasonStats = useMemo(() => {
    const counts: Record<string, number> = { spring: 0, summer: 0, autumn: 0, winter: 0 };
    poems.forEach((p) => {
      if (p.season && counts[p.season] !== undefined) {
        counts[p.season]++;
      }
    });
    return counts;
  }, [poems]);

  // 热力图颜色
  const getHeatColor = (count: number) => {
    if (count === 0) return "bg-ink/5";
    if (count === 1) return "bg-cinnabar/20";
    if (count === 2) return "bg-cinnabar/40";
    if (count === 3) return "bg-cinnabar/60";
    return "bg-cinnabar";
  };

  // 词云字号（根据频率）
  const getTagSize = (count: number, max: number) => {
    const ratio = count / max;
    if (ratio > 0.7) return "text-2xl";
    if (ratio > 0.4) return "text-lg";
    return "text-sm";
  };

  if (loading) {
    return (
      <div className="paper-texture min-h-screen">
        <Navbar />
        <main className="page-container flex items-center justify-center">
          <div className="skeleton w-48 h-8" />
        </main>
      </div>
    );
  }

  const maxTagCount = tagStats[0]?.[1] || 1;
  const totalDays = Object.keys(heatmapData).length;
  const activeDays = Object.values(heatmapData).filter((c) => c > 0).length;
  const totalPoems = poems.length;
  const totalChars = poems.reduce((sum, p) => sum + p.content.length, 0);

  return (
    <div className="paper-texture min-h-screen">
      <Navbar />
      <main className="page-container max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-[var(--font-mashan)] text-4xl text-ink-dark mb-2">
            数据统计
          </h1>
          <p className="text-ink-light text-sm">
            墨迹留痕，岁月可期
          </p>
        </motion.div>

        {/* 概览卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard label="诗词总数" value={totalPoems} unit="首" />
          <StatCard label="累计字数" value={totalChars} unit="字" />
          <StatCard label="活跃天数" value={activeDays} unit="天" />
          <StatCard label="使用标签" value={tagStats.length} unit="个" />
        </div>

        {/* 写作热力图 */}
        <section className="mb-12 p-6 rounded-xl bg-white/60 border border-ink/8">
          <h2 className="font-[var(--font-mashan)] text-lg text-ink-dark mb-4">
            写作热力图
          </h2>
          <p className="text-xs text-ink-light mb-4">
            最近 {totalDays} 天的写作记录，每个方块代表一天
          </p>

          <div className="overflow-x-auto">
            <div className="inline-flex gap-0.5 pb-2">
              {Object.entries(heatmapData).map(([date, count]) => {
                const d = new Date(date);
                const isToday = date === new Date().toISOString().slice(0, 10);
                return (
                  <div
                    key={date}
                    className={`w-3 h-3 rounded-sm ${getHeatColor(count)} transition-all hover:scale-110 cursor-default`}
                    title={`${date} · ${count} 首${isToday ? " (今天)" : ""}`}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 text-xs text-ink-light">
            <span>少</span>
            <div className="flex gap-0.5">
              <div className="w-3 h-3 rounded-sm bg-ink/5" />
              <div className="w-3 h-3 rounded-sm bg-cinnabar/20" />
              <div className="w-3 h-3 rounded-sm bg-cinnabar/40" />
              <div className="w-3 h-3 rounded-sm bg-cinnabar/60" />
              <div className="w-3 h-3 rounded-sm bg-cinnabar" />
            </div>
            <span>多</span>
          </div>
        </section>

        {/* 标签词云 */}
        {tagStats.length > 0 && (
          <section className="mb-12 p-6 rounded-xl bg-white/60 border border-ink/8">
            <h2 className="font-[var(--font-mashan)] text-lg text-ink-dark mb-4">
              标签词云
            </h2>
            <p className="text-xs text-ink-light mb-4">
              字号越大，使用频率越高
            </p>

            <div className="flex flex-wrap gap-3 justify-center items-center">
              {tagStats.map(([tag, count]) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`inline-block px-3 py-1 rounded-full transition-all hover:scale-110 cursor-default ${getTagSize(count, maxTagCount)}`}
                  style={{
                    fontFamily: "var(--font-lxgw)",
                    backgroundColor: `rgba(193, 74, 63, ${0.1 + (count / maxTagCount) * 0.3})`,
                    color: "#C14A3F",
                  }}
                  title={`${count} 首`}
                >
                  #{tag}
                </motion.span>
              ))}
            </div>
          </section>
        )}

        {/* 季节分布 */}
        <section className="mb-12 p-6 rounded-xl bg-white/60 border border-ink/8">
          <h2 className="font-[var(--font-mashan)] text-lg text-ink-dark mb-4">
            季节分布
          </h2>
          <div className="grid grid-cols-4 gap-4">
            {(["spring", "summer", "autumn", "winter"] as const).map((season) => {
              const count = seasonStats[season];
              const ratio = totalPoems > 0 ? (count / totalPoems) * 100 : 0;
              const colors = {
                spring: "bg-green-500",
                summer: "bg-yellow-500",
                autumn: "bg-orange-500",
                winter: "bg-blue-500",
              };
              const names = {
                spring: "春",
                summer: "夏",
                autumn: "秋",
                winter: "冬",
              };
              return (
                <div key={season} className="text-center">
                  <div className="relative h-32 bg-ink/5 rounded-lg overflow-hidden mb-2">
                    <div
                      className={`absolute bottom-0 left-0 right-0 ${colors[season]} transition-all`}
                      style={{ height: `${ratio}%` }}
                    />
                  </div>
                  <div className="font-[var(--font-mashan)] text-lg text-ink-dark">
                    {names[season]}
                  </div>
                  <div className="text-xs text-ink-light">
                    {count} 首 · {ratio.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 写作趋势（最近 7 天） */}
        <section className="p-6 rounded-xl bg-white/60 border border-ink/8">
          <h2 className="font-[var(--font-mashan)] text-lg text-ink-dark mb-4">
            最近 7 天
          </h2>
          <div className="space-y-2">
            {Object.entries(heatmapData)
              .slice(0, 7)
              .reverse()
              .map(([date, count]) => {
                const dayName = new Date(date).toLocaleDateString("zh-CN", {
                  weekday: "short",
                  month: "numeric",
                  day: "numeric",
                });
                const maxInWeek = Math.max(...Object.values(heatmapData).slice(0, 7), 1);
                const ratio = (count / maxInWeek) * 100;
                return (
                  <div key={date} className="flex items-center gap-3">
                    <div className="w-20 text-xs text-ink-light text-right">
                      {dayName}
                    </div>
                    <div className="flex-1 h-6 bg-ink/5 rounded overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${ratio}%` }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className={`h-full ${count > 0 ? "bg-cinnabar/60" : "bg-transparent"}`}
                      />
                    </div>
                    <div className="w-12 text-right text-sm text-ink-light">
                      {count} 首
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-white/60 border border-ink/8 text-center"
    >
      <div className="font-[var(--font-mashan)] text-2xl text-ink-dark">
        {value.toLocaleString()}
        <span className="text-sm text-ink-light ml-1">{unit}</span>
      </div>
      <div className="text-xs text-ink-light mt-1">{label}</div>
    </motion.div>
  );
}
