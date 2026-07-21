// ============================================================
// 标签总览页（/tags）— 标签云 + 热门榜（按收藏数）
// ============================================================
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PoemCard from "@/components/poem/PoemCard";
import { getAllPoems } from "@/lib/api";
import { getAllCollections } from "@/lib/db";
import type { Poem, Collection } from "@/types/poem";

export default function TagsPage() {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ps, cs] = await Promise.all([getAllPoems(), getAllCollections()]);
        setPoems(ps);
        setCollections(cs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const colMap = useMemo(() => {
    const m: Record<string, Collection> = {};
    collections.forEach((c) => (m[c.id] = c));
    return m;
  }, [collections]);

  // 标签统计
  const tagStats = useMemo(() => {
    const counts: Record<string, number> = {};
    poems.forEach((p) => {
      (p.tags || []).forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [poems]);

  const maxCount = tagStats[0]?.count || 1;

  // 热门榜：按收藏数排序，取前 10
  const hotPoems = useMemo(() => {
    return [...poems]
      .filter((p) => (p.favoriteCount || 0) > 0)
      .sort((a, b) => (b.favoriteCount || 0) - (a.favoriteCount || 0))
      .slice(0, 10);
  }, [poems]);

  // 字号按频次映射（14px ~ 30px）
  const sizeFor = (count: number) =>
    14 + Math.round((count / maxCount) * 16);

  return (
    <div className="paper-texture min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 page-container max-w-5xl mx-auto px-6 py-12 w-full">
        <div className="text-center mb-12">
          <h1
            className="font-[var(--font-mashan)] text-4xl text-ink-dark mb-2"
            style={{ fontFamily: "var(--font-mashan)" }}
          >
            标签墨林
          </h1>
          <p className="text-ink-light text-sm">循标签而入，见诗心万象</p>
        </div>

        {loading ? (
          <div className="text-center text-ink-light py-20">加载中...</div>
        ) : (
          <>
            {/* 标签云 */}
            <section className="mb-16">
              <h2 className="text-xs text-ink-light tracking-wider uppercase mb-6 text-center">
                标签云
              </h2>
              {tagStats.length === 0 ? (
                <p className="text-center text-ink-light/60 text-sm py-10">
                  还没有标签，去写诗或编辑时添加吧
                </p>
              ) : (
                <div className="flex flex-wrap justify-center items-center gap-3 max-w-3xl mx-auto">
                  {tagStats.map(({ tag, count }, i) => (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Link
                        href={`/tags/${encodeURIComponent(tag)}`}
                        className="inline-flex items-baseline gap-1 text-ink hover:text-cinnabar transition-colors"
                        style={{ fontSize: `${sizeFor(count)}px` }}
                      >
                        <span style={{ fontFamily: "var(--font-mashan)" }}>#{tag}</span>
                        <span className="text-xs text-ink-light/50">{count}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* 热门榜 */}
            {hotPoems.length > 0 && (
              <section>
                <h2 className="text-xs text-ink-light tracking-wider uppercase mb-6 text-center">
                  收藏热榜
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hotPoems.map((poem, i) => (
                    <PoemCard
                      key={poem.id}
                      poem={poem}
                      index={i}
                      collection={colMap[poem.collectionId]}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
