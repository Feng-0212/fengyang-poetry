// ============================================================
// 诗词日历（/yuan/sishi-moyuan/calendar）
// 按创作日期月历展示诗词，呼应「藏时光」定位。
// 支持月份切换、当日诗数徽标、节气标记、点选日期查看当日诗词。
// ============================================================
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AtmosphereLayer from "@/components/poem/AtmosphereLayer";
import { useSolarTerm } from "@/hooks/useSolarTerm";
import { usePoems } from "@/hooks/usePoem";
import { getCollectionBySlug } from "@/lib/db";
import { getSolarTerm } from "@/lib/solarterms";
import { COLLECTION_IDS } from "@/types/poem";
import type { Poem } from "@/types/poem";
import { m as motion } from "framer-motion";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function toLocalKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const solarTerm = useSolarTerm();
  const [colId, setColId] = useState<string | undefined>(undefined);
  const [cursor, setCursor] = useState(() => new Date()); // 当前展示的月份
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    getCollectionBySlug(COLLECTION_IDS.SISHI_MOYUAN).then((c) => {
      if (c) setColId(c.id);
    });
  }, []);

  const { poems, loading } = usePoems(colId ?? "");

  // 按日期分组（本地时区）
  const byDay = useMemo(() => {
    const map: Record<string, Poem[]> = {};
    poems.forEach((p) => {
      let ts = p.createdAt as number | string;
      if (typeof ts === "string") ts = new Date(ts).getTime();
      if (!ts || Number.isNaN(ts)) return;
      const key = toLocalKey(new Date(ts));
      (map[key] = map[key] || []).push(p);
    });
    return map;
  }, [poems]);

  // 构建月历格子
  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = toLocalKey(new Date());

    const list: {
      key: string;
      day: number;
      count: number;
      termName?: string;
      isToday: boolean;
      isSelected: boolean;
    }[] = [];
    for (let i = 0; i < startOffset; i++) {
      list.push({ key: `pad-${i}`, day: 0, count: 0, isToday: false, isSelected: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const key = toLocalKey(date);
      const prev = new Date(year, month, d - 1);
      const term = getSolarTerm(date);
      const prevTerm = getSolarTerm(prev);
      list.push({
        key,
        day: d,
        count: byDay[key]?.length || 0,
        termName: term.name !== prevTerm.name ? term.name : undefined,
        isToday: key === todayKey,
        isSelected: key === selectedKey,
      });
    }
    return list;
  }, [cursor, byDay, selectedKey]);

  const selectedPoems = selectedKey ? byDay[selectedKey] || [] : [];

  const monthLabel = `${cursor.getFullYear()} 年 ${cursor.getMonth() + 1} 月`;
  const monthCount = Object.entries(byDay).reduce((sum, [k, list]) => {
    if (k.startsWith(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`)) {
      return sum + list.length;
    }
    return sum;
  }, 0);

  const changeMonth = (delta: number) => {
    setSelectedKey(null);
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  };

  return (
    <div className="paper-texture min-h-screen flex flex-col">
      <AtmosphereLayer solarTerm={solarTerm} />
      <Navbar />
      <main className="flex-1 page-container relative z-10">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="font-[var(--font-mashan)] text-4xl text-ink-dark mb-2">诗词日历</h1>
            <p className="text-ink-light text-sm">以日为尺，丈量诗心 · 当月 {monthCount} 首</p>
          </div>

          {/* 月份切换 */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => changeMonth(-1)}
              className="px-4 py-1.5 rounded-full text-sm text-ink-light hover:bg-ink/5 border border-ink/10"
              aria-label="上一个月"
            >
              ← 上月
            </button>
            <span className="font-[var(--font-mashan)] text-xl text-ink-dark">{monthLabel}</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setSelectedKey(null); setCursor(new Date()); }}
                className="px-4 py-1.5 rounded-full text-sm text-ink-light hover:bg-ink/5 border border-ink/10"
              >
                本月
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="px-4 py-1.5 rounded-full text-sm text-ink-light hover:bg-ink/5 border border-ink/10"
                aria-label="下一个月"
              >
                下月 →
              </button>
            </div>
          </div>

          {/* 星期表头 */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-xs text-ink-light/60 py-1">
                {w}
              </div>
            ))}
          </div>

          {/* 日历网格 */}
          {loading ? (
            <div className="grid grid-cols-7 gap-1.5">
              {[...Array(35)].map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((c) => {
                if (c.day === 0) return <div key={c.key} />;
                return (
                  <motion.button
                    key={c.key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedKey(c.key)}
                    className={`relative h-20 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all ${
                      c.isSelected
                        ? "border-cinnabar/50 bg-cinnabar/10"
                        : c.isToday
                        ? "border-cinnabar/30 bg-cinnabar/5"
                        : "border-ink/8 bg-white/50 hover:border-ink/20"
                    }`}
                    aria-label={`${c.key}，${c.count} 首`}
                  >
                    <span className={`text-sm ${c.isToday ? "text-cinnabar font-medium" : "text-ink-dark"}`}>
                      {c.day}
                    </span>
                    {c.count > 0 && (
                      <span
                        className="text-[10px] px-1.5 rounded-full text-white"
                        style={{ backgroundColor: solarTerm.color }}
                      >
                        {c.count}
                      </span>
                    )}
                    {c.termName && (
                      <span className="absolute top-1 right-1 text-[10px] text-gold" title={c.termName}>
                        {c.termName}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* 当日诗词 */}
          <section className="mt-8">
            {selectedKey ? (
              <div className="p-6 rounded-2xl bg-white/60 border border-ink/8">
                <h2 className="font-[var(--font-mashan)] text-lg text-ink-dark mb-4">
                  {selectedKey} · {selectedPoems.length} 首
                </h2>
                {selectedPoems.length === 0 ? (
                  <p className="text-sm text-ink-light/60">这一天没有落笔，让墨香留白。</p>
                ) : (
                  <div className="space-y-3">
                    {selectedPoems.map((p) => (
                      <Link
                        key={p.id}
                        href={`/poem/${p.id}`}
                        className="block p-4 rounded-xl bg-rice border border-ink/8 hover:border-cinnabar/30 transition-colors"
                      >
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-[var(--font-mashan)] text-lg text-ink-dark">
                            《{p.title}》
                          </span>
                          <span className="text-xs text-ink-light">
                            {p.author}{p.dynasty ? ` · ${p.dynasty}` : ""}
                          </span>
                        </div>
                        <p className="text-sm text-ink-light leading-relaxed line-clamp-2">
                          {p.content}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-ink-light/50 text-sm">
                点击任意日期，查看当天的诗词
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
