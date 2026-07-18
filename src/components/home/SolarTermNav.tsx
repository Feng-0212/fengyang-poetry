// ============================================================
// 四时墨苑 - 二十四节气导航
// ============================================================
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SOLAR_TERMS_META } from "@/lib/solarterms";
import { useSolarTerm } from "@/hooks/useSolarTerm";
import { cn } from "@/lib/utils";

const SEASON_LABELS: Record<string, string> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
};

export default function SolarTermNav() {
  const currentSolarTerm = useSolarTerm();

  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-10">
          <h2 className="font-[var(--font-mashan)] text-2xl text-ink-dark mb-2">
            二十四节气
          </h2>
          <p className="text-ink-light text-sm">
            顺天时而动，与万物同息
          </p>
        </div>

        {/* 节气网格 */}
        <div className="grid grid-cols-6 md:grid-cols-8 gap-2">
          {SOLAR_TERMS_META.map((st, index) => {
            const isActive = st.key === currentSolarTerm.key;
            return (
              <motion.div
                key={st.key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
              >
                <Link
                  href={`/seasons?solarTerm=${st.key}`}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-300 group relative",
                    isActive
                      ? "scale-105 z-10"
                      : "hover:bg-ink/5"
                  )}
                  title={st.imagery}
                >
                  {/* 活跃指示器 */}
                  {isActive && (
                    <motion.div
                      layoutId="solar-indicator"
                      className="absolute inset-0 rounded-lg"
                      style={{
                        backgroundColor: `${st.color}15`,
                        border: `1px solid ${st.color}40`,
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  {/* 节气印章 */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded flex items-center justify-center text-white text-xs font-medium relative z-10 transition-all duration-300",
                      isActive ? "scale-110 shadow-md" : "opacity-70 group-hover:opacity-100"
                    )}
                    style={{ backgroundColor: isActive ? st.color : `${st.color}90` }}
                  >
                    {st.name.slice(0, 1)}
                  </div>

                  {/* 节气名 */}
                  <span
                    className={cn(
                      "text-xs relative z-10 transition-colors",
                      isActive ? "text-ink-dark font-medium" : "text-ink-light group-hover:text-ink"
                    )}
                  >
                    {st.name.slice(1)}
                  </span>

                  {/* 季节标签 */}
                  {isActive && (
                    <span
                      className="text-[10px] px-1 rounded-full"
                      style={{
                        backgroundColor: `${st.color}20`,
                        color: st.color,
                      }}
                    >
                      {SEASON_LABELS[st.season]}
                    </span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* 当前节气详情 */}
        <motion.div
          key={currentSolarTerm.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center"
        >
          <div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full"
            style={{
              backgroundColor: `${currentSolarTerm.color}12`,
              border: `1px solid ${currentSolarTerm.color}30`,
            }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: currentSolarTerm.color }}
            />
            <span className="text-sm text-ink">
              {currentSolarTerm.name} · {currentSolarTerm.dateRange} · {currentSolarTerm.imagery}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
