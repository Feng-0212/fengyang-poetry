// ============================================================
// 四时墨苑 - 藏网格（CollectionGrid）
// ============================================================
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Collection } from "@/types/poem";

interface Props {
  collections: Collection[];
  loading: boolean;
}

function CollectionCard({
  collection,
  index,
}: {
  collection: Collection;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: 0.2 + index * 0.1,
        duration: 0.7,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{ y: -4 }}
    >
      <Link href={`/yuan/${collection.slug}`}>
        <article
          className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300 group cursor-pointer"
          style={{
            background: `linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)`,
            border: `1px solid ${collection.color}25`,
            boxShadow: `0 4px 24px ${collection.color}08`,
          }}
        >
          {/* Hover glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${collection.color}10 0%, transparent 60%)`,
            }}
          />

          {/* 顶部：印章 + 图标 */}
          <div className="flex items-start justify-between mb-4 relative z-10">
            {/* 印章 */}
            <div
              className="relative"
              style={{ filter: `drop-shadow(0 2px 4px ${collection.color}30)` }}
            >
              <svg
                viewBox="0 0 100 100"
                width="52"
                height="52"
              >
                <rect
                  x="5"
                  y="5"
                  width="90"
                  height="90"
                  rx="3"
                  fill={collection.color}
                />
                <rect
                  x="9"
                  y="9"
                  width="82"
                  height="82"
                  rx="2"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  opacity="0.3"
                />
                <text
                  x="50"
                  y="50"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="44"
                  fontWeight="900"
                  fontFamily="serif"
                >
                  {collection.seal}
                </text>
              </svg>
            </div>

            {/* 主题图标 */}
            <div
              className="text-2xl"
              style={{ filter: `drop-shadow(0 2px 4px ${collection.color}20)` }}
            >
              {collection.glyph}
            </div>
          </div>

          {/* 藏名 */}
          <h2
            className="font-[var(--font-mashan)] text-xl text-ink-dark mb-1 group-hover:transition-colors"
            style={{ fontFamily: "var(--font-mashan)" }}
          >
            {collection.name}
          </h2>

          {/* 副标 */}
          <p
            className="text-xs mb-3"
            style={{ color: `${collection.color}90` }}
          >
            {collection.subname}
          </p>

          {/* 简介 */}
          <p className="text-sm text-ink-light leading-relaxed mb-4">
            {collection.blurb}
          </p>

          {/* 底部：诗词数 + 进入 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-ink-light/60">
              <span className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                {collection.poemCount} 首
              </span>
              <span
                className="px-1.5 py-0.5 rounded text-[10px]"
                style={{
                  backgroundColor: `${collection.color}15`,
                  color: collection.color,
                }}
              >
                {collection.isSystem ? "预置" : "自建"}
              </span>
            </div>

            {/* 进入箭头 */}
            <motion.div
              className="text-ink-light/30 group-hover:text-ink transition-colors"
              style={{ color: `${collection.color}80` }}
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

          {/* 底部装饰线 */}
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-500"
            style={{
              background: `linear-gradient(to right, transparent, ${collection.color}60, transparent)`,
              opacity: 0,
            }}
          />
        </article>
      </Link>
    </motion.div>
  );
}

export default function CollectionGrid({
  collections,
  loading,
}: Props) {
  if (loading) {
    return (
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 animate-pulse"
              style={{
                background: "rgba(255,255,255,0.7)",
                height: 220,
              }}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-6 pb-20">
      {/* 标题 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-4 mb-8"
      >
        <div
          className="h-px flex-1"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(26,26,26,0.1))",
          }}
        />
        <span className="text-xs text-ink-light/50 tracking-widest uppercase">
          藏 · 六院
        </span>
        <div
          className="h-px flex-1"
          style={{
            background:
              "linear-gradient(to left, transparent, rgba(26,26,26,0.1))",
          }}
        />
      </motion.div>

      {/* 藏卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {collections.map((col, i) => (
          <CollectionCard key={col.id} collection={col} index={i} />
        ))}
      </div>

      {/* 创建新藏 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="mt-5"
      >
        <Link href="/yuan/new">
          <div
            className="rounded-2xl p-6 border-2 border-dashed cursor-pointer transition-all hover:border-ink/20 group"
            style={{ borderColor: "rgba(26,26,26,0.12)" }}
          >
            <div className="flex items-center gap-3 text-ink-light/40 group-hover:text-ink-light transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="text-sm">创建新藏</span>
            </div>
          </div>
        </Link>
      </motion.div>
    </section>
  );
}
