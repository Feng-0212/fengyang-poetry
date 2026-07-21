// ============================================================
// 标签筛选页（/tags/[tag]）— 展示某标签下所有诗词
// ============================================================
"use client";

import { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PoemCard from "@/components/poem/PoemCard";
import { getAllPoems } from "@/lib/api";
import { getAllCollections } from "@/lib/db";
import type { Poem, Collection } from "@/types/poem";

interface Props {
  params: Promise<{ tag: string }>;
}

export default function TagDetailPage({ params }: Props) {
  const { tag: rawTag } = use(params);
  const tag = decodeURIComponent(rawTag);

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

  const matched = useMemo(
    () => poems.filter((p) => (p.tags || []).includes(tag)),
    [poems, tag]
  );

  return (
    <div className="paper-texture min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 page-container max-w-5xl mx-auto px-6 py-12 w-full">
        <div className="mb-8">
          <Link
            href="/tags"
            className="inline-flex items-center gap-2 text-sm text-ink-light hover:text-ink transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            标签墨林
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1
            className="font-[var(--font-mashan)] text-4xl text-cinnabar mb-2"
            style={{ fontFamily: "var(--font-mashan)" }}
          >
            #{tag}
          </h1>
          <p className="text-ink-light text-sm">
            {loading ? "检索中..." : `共 ${matched.length} 首`}
          </p>
        </div>

        {loading ? (
          <div className="text-center text-ink-light py-20">加载中...</div>
        ) : matched.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-ink-light text-sm mb-6">该标签下暂无诗词</p>
            <Link href="/tags" className="text-cinnabar text-sm hover:underline">
              返回标签墨林
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matched.map((poem, i) => (
              <PoemCard
                key={poem.id}
                poem={poem}
                index={i}
                collection={colMap[poem.collectionId]}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
