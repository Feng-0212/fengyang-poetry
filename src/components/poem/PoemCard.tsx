// ============================================================
// 四时墨苑 - 诗词卡片 — Phase 3 升级版（SVG 印章 + 墨迹晕染）
// ============================================================
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn, formatRelativeTime } from "@/lib/utils";
import { getSolarTermMeta } from "@/lib/solarterms";
import SealStamp from "@/components/seals/SealStamp";
import type { Poem, Collection } from "@/types/poem";

interface Props {
  poem: Poem;
  index?: number;
  collection?: Collection | null;
}

export default function PoemCard({ poem, index = 0, collection }: Props) {
  const meta = getSolarTermMeta(poem.solarTerm);

  // 截取前 4 句作为预览
  const preview = poem.content
    .split(/[，。；！？\n]/)
    .filter(Boolean)
    .slice(0, 4)
    .join("，");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay: index * 0.08, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -3 }}
    >
      <Link href={`/poem/${poem.id}`}>
        <article
          className={cn(
            "poem-card group cursor-pointer relative overflow-hidden"
          )}
          style={{
            borderColor: `${meta?.color || "#1A1A1A"}15`,
          }}
        >
          {/* 墨迹晕染背景层（hover 显现） */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              background: `radial-gradient(ellipse at top right, ${meta?.color || "#1A1A1A"}12 0%, transparent 60%)`,
            }}
          />

          {/* 顶部：藏印章 + 时间 */}
          <div className="flex items-start justify-between mb-4 relative z-10">
            {collection ? (
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center text-white text-lg font-bold shadow-sm"
                style={{
                  backgroundColor: collection.color,
                  boxShadow: `0 2px 6px ${collection.color}30`,
                }}
                title={collection.name}
              >
                {collection.seal}
              </div>
            ) : (
              <SealStamp
                term={poem.solarTerm}
                size="sm"
                color={meta?.color}
                animated={false}
              />
            )}

            <div className="flex flex-col items-end gap-1">
              {poem.isFavorite && (
                <span className="text-cinnabar text-xs">♥</span>
              )}
              <span className="text-xs text-ink-light">
                {formatRelativeTime(poem.createdAt)}
              </span>
            </div>
          </div>

          {/* 标题 — 笔触感 */}
          <h3
            className="font-[var(--font-mashan)] text-xl text-ink-dark mb-3 group-hover:text-cinnabar transition-colors relative z-10"
            style={{ fontFamily: "var(--font-mashan)" }}
          >
            {poem.title}
          </h3>

          {/* 诗词预览 */}
          <div
            className="text-sm text-ink leading-loose mb-4 overflow-hidden relative z-10"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              lineHeight: "1.8",
              height: "5.4em",
            }}
          >
            {preview}
          </div>

          {/* 底部标签：显示藏印章字 */}
          <div className="flex items-center justify-between relative z-10">
            <div
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: collection ? `${collection.color}15` : `${meta?.color || "#8B9A6B"}15`,
                color: collection ? collection.color : meta?.color || "#8B9A6B",
              }}
            >
              {collection ? collection.seal : meta?.name}
            </div>

            {/* 右侧箭头 */}
            <motion.div
              className="text-ink-light/40 group-hover:text-cinnabar transition-colors"
              initial={{ x: 0 }}
              whileHover={{ x: 4 }}
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
                  strokeWidth={1.5}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </motion.div>
          </div>

          {/* 卡片右上角：诗的小型水墨晕染 */}
          <div
            className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity duration-700"
            style={{
              background: `radial-gradient(circle, ${meta?.color || "#1A1A1A"}30 0%, transparent 70%)`,
            }}
          />
        </article>
      </Link>
    </motion.div>
  );
}
