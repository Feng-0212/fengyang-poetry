// ============================================================
// 四时墨苑 - 藏主页（/yuan/[slug]）
// ============================================================
"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PoemCard from "@/components/poem/PoemCard";
import { useCollection } from "@/hooks/useCollection";
import { usePoems } from "@/hooks/usePoem";
import { motion } from "framer-motion";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function CollectionPage({ params }: Props) {
  const { slug } = use(params);
  const router = useRouter();
  const { collection, loading: colLoading } = useCollection(slug);
  const { poems, loading: poemsLoading } = usePoems(collection?.id);

  if (colLoading) {
    return (
      <div className="paper-texture min-h-screen">
        <Navbar />
        <main className="page-container flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="skeleton w-16 h-16 rounded-full mx-auto mb-4" />
            <div className="skeleton w-32 h-6 mx-auto mb-2" />
            <div className="skeleton w-48 h-4 mx-auto" />
          </div>
        </main>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="paper-texture min-h-screen">
        <Navbar />
        <main className="page-container flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="font-[var(--font-mashan)] text-2xl text-ink-dark mb-2">
              藏不存在
            </h2>
            <p className="text-ink-light text-sm mb-6">
              这个藏可能被删除了
            </p>
            <a href="/" className="text-cinnabar text-sm hover:underline">
              返回墨韵阁
            </a>
          </div>
        </main>
      </div>
    );
  }

  // 四时墨苑走专属页面
  if (slug === "sishi-moyuan") {
    router.replace("/yuan/sishi-moyuan");
    return null;
  }

  return (
    <div className="paper-texture min-h-screen flex flex-col">
      <Navbar />
      <main className="page-container flex-1">
        <div className="max-w-5xl mx-auto px-6 py-12">
          {/* 顶部：藏信息 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            {/* 返回墨韵阁 */}
            <div className="mb-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-ink-light hover:text-ink transition-colors"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                墨韵阁
              </Link>
            </div>

            <div className="flex items-start gap-6">
              {/* 印章 */}
              <div
                className="flex-shrink-0"
                style={{ filter: `drop-shadow(0 4px 8px ${collection.color}30)` }}
              >
                <svg viewBox="0 0 100 100" width="80" height="80">
                  <rect
                    x="4"
                    y="4"
                    width="92"
                    height="92"
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
                    fontSize="50"
                    fontWeight="900"
                    fontFamily="serif"
                  >
                    {collection.seal}
                  </text>
                </svg>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1
                    className="text-3xl text-ink-dark"
                    style={{ fontFamily: "var(--font-mashan)" }}
                  >
                    {collection.name}
                  </h1>
                  <span
                    className="text-sm px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${collection.color}15`,
                      color: collection.color,
                    }}
                  >
                    {collection.subname}
                  </span>
                </div>
                <p className="text-ink-light mb-4">{collection.blurb}</p>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-ink-light/60">
                    {poems.length} 首诗词
                  </span>
                  <Link
                    href={`/yuan/${slug}/write`}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm text-white transition-all"
                    style={{ backgroundColor: collection.color }}
                  >
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    落笔
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 诗词列表 */}
          {poemsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton rounded-xl h-48" />
              ))}
            </div>
          ) : poems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-ink-light/50 mb-4">藏中暂无诗词</p>
              <Link
                href={`/yuan/${slug}/write`}
                className="text-sm text-cinnabar hover:underline"
              >
                去写一首 →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {poems.map((poem, i) => (
                <PoemCard key={poem.id} poem={poem} index={i} collection={collection} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
