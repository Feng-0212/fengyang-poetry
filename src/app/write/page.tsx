// ============================================================
// 四时墨苑 - 写诗选藏页（/write）
// 从设置/导航进来后可选择要写入的藏
// ============================================================
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useCollections } from "@/hooks/useCollection";
import type { Collection } from "@/types/poem";

export default function ChooseCollectionPage() {
  const { collections, loading } = useCollections();

  return (
    <div className="paper-texture min-h-screen flex flex-col">
      <Navbar />

      <main className="page-container flex-1">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* 返回 */}
          <div className="mb-8">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 text-sm text-ink-light hover:text-ink transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              墨苑管理
            </Link>
          </div>

          <div className="text-center mb-12">
            <h1
              className="font-[var(--font-mashan)] text-4xl text-ink-dark mb-2"
              style={{ fontFamily: "var(--font-mashan)" }}
            >
              落笔何处
            </h1>
            <p className="text-ink-light text-sm">选择一方藏，写下你的诗</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-ink-light">
              加载中...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {collections.map((c, i) => (
                <CollectionWriteCard key={c.id} collection={c} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function CollectionWriteCard({
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
        delay: 0.15 + index * 0.08,
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{ y: -4 }}
    >
      <Link href={`/yuan/${collection.slug}/write`}>
        <article
          className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300 group cursor-pointer"
          style={{
            background: `linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)`,
            border: `1px solid ${collection.color}25`,
            boxShadow: `0 4px 24px ${collection.color}08`,
          }}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${collection.color}10 0%, transparent 60%)`,
            }}
          />

          <div className="flex items-start justify-between mb-4 relative z-10">
            <div
              className="relative"
              style={{ filter: `drop-shadow(0 2px 4px ${collection.color}30)` }}
            >
              <svg viewBox="0 0 100 100" width="52" height="52">
                <rect x="5" y="5" width="90" height="90" rx="3" fill={collection.color} />
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

            <div
              className="text-2xl"
              style={{ filter: `drop-shadow(0 2px 4px ${collection.color}20)` }}
            >
              {collection.glyph}
            </div>
          </div>

          <h2
            className="font-[var(--font-mashan)] text-xl text-ink-dark mb-1"
            style={{ fontFamily: "var(--font-mashan)" }}
          >
            {collection.name}
          </h2>
          <p className="text-xs text-ink-light mb-4">{collection.subname}</p>

          <div
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-all"
            style={{ color: collection.color }}
          >
            在此写诗
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
