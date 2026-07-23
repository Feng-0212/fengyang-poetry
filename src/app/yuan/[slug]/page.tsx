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
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { getSolarTermMeta, getSeasonName } from "@/lib/solarterms";
import type { Poem, Collection } from "@/types/poem";
import { usePasswordGate } from "@/components/auth/PasswordGate";
import { deleteCollection } from "@/lib/db";
import { deleteCollectionApi } from "@/lib/api";
import { exportMarkdown } from "@/lib/export";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function CollectionPage({ params }: Props) {
  const { slug } = use(params);
  const router = useRouter();
  const { collection, loading: colLoading } = useCollection(slug);
  const { poems, loading: poemsLoading } = usePoems(collection?.id ?? "");

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

  const layout = collection.layout || "classic";
  const { requirePassword } = usePasswordGate();

  const handleDeleteCollection = async () => {
    if (!collection) return;
    requirePassword(async () => {
      if (!confirm(`确定要删除「${collection.name}」及其中所有诗词吗？此操作不可撤销。`)) return;
      try {
        await Promise.all([
          deleteCollectionApi(collection.id),
          deleteCollection(collection.id),
        ]);
        router.push("/");
      } catch (e) {
        console.error("删除藏失败", e);
        alert("删除失败，请重试");
      }
    });
  };

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
            className="mb-10"
          >
            {/* 返回墨韵阁 */}
            <div className="mb-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-ink-light hover:text-ink transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
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
                  <rect x="4" y="4" width="92" height="92" rx="3" fill={collection.color} />
                  <rect x="9" y="9" width="82" height="82" rx="2" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
                  <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="50" fontWeight="900" fontFamily="serif">{collection.seal}</text>
                </svg>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl text-ink-dark" style={{ fontFamily: "var(--font-mashan)" }}>
                    {collection.name}
                  </h1>
                  <span className="text-sm px-2 py-0.5 rounded-full" style={{ backgroundColor: `${collection.color}15`, color: collection.color }}>
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
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: collection.color }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    落笔
                  </Link>
                  <button
                    onClick={() =>
                      exportMarkdown(
                        poems as unknown as Poem[],
                        `${collection.name}·诗词集`,
                        [{ id: collection.id, name: collection.name }]
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm border border-ink/15 text-ink-light hover:border-cinnabar/40 hover:text-cinnabar transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    导出
                  </button>
                  {!collection.isSystem && (
                    <button
                      onClick={handleDeleteCollection}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm text-red-400 border border-red-200 hover:bg-red-50 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      删除
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 内容区：根据 layout 渲染 */}
          {poemsLoading ? (
            <LayoutSkeletons layout={layout} />
          ) : poems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-ink-light/50 mb-4">藏中暂无诗词</p>
              <Link href={`/yuan/${slug}/write`} className="text-sm text-cinnabar hover:underline">去写一首 →</Link>
            </div>
          ) : (
            <LayoutRenderer poems={poems} collection={collection} layout={layout} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ============================================================
// 布局渲染器
// ============================================================
function LayoutRenderer({ poems, collection, layout }: {
  poems: Poem[]; collection: Collection; layout: string;
}) {
  switch (layout) {
    case "list":
      return <ListLayout poems={poems} collection={collection} />;
    case "gallery":
      return <GalleryLayout poems={poems} collection={collection} />;
    default:
      return <ClassicLayout poems={poems} collection={collection} />;
  }
}

function LayoutSkeletons({ layout }: { layout: string }) {
  switch (layout) {
    case "list":
      return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-lg" />)}</div>;
    case "gallery":
      return <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="skeleton rounded-xl h-64" />)}</div>;
    default:
      return <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{[...Array(4)].map((_, i) => <div key={i} className="skeleton rounded-xl h-48" />)}</div>;
  }
}

// -----------------------------------------------------------
// 经典布局（卷轴卡片）
// 外观：双列网格，卷轴装饰边，竖排感
// -----------------------------------------------------------
function ClassicLayout({ poems, collection }: { poems: Poem[]; collection: Collection }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {poems.map((poem, i) => (
        <PoemCard key={poem.id} poem={poem} index={i} collection={collection} />
      ))}
    </div>
  );
}

// -----------------------------------------------------------
// 列表布局（极简条目）
// 外观：单列，左图右文，仅显示标题/季节/日期
// -----------------------------------------------------------
function ListLayout({ poems, collection }: { poems: Poem[]; collection: Collection }) {
  return (
    <div className="space-y-1">
      {poems.map((poem, i) => {
        const meta = getSolarTermMeta(poem.solarTerm);
        return (
          <Link key={poem.id} href={`/poem/${poem.id}`}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="group flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-white/60 transition-all border border-transparent hover:border-ink/8"
            >
              {/* 藏色小方章 */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: collection.color }}
              >
                {collection.seal}
              </div>

              {/* 标题 + 摘要 */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-ink-dark group-hover:text-cinnabar transition-colors truncate"
                  style={{ fontFamily: "var(--font-mashan)" }}>
                  {poem.title}
                </div>
                <div className="text-xs text-ink-light/60 truncate mt-0.5">
                  {poem.content.slice(0, 40)}{poem.content.length > 40 ? "…" : ""}
                </div>
              </div>

              {/* 元信息 */}
              <div className="flex-shrink-0 text-right">
                <div className="text-xs text-ink-light/60">{getSeasonName(poem.season)}季</div>
                <div className="text-xs text-ink-light/40 mt-0.5">{meta?.name}</div>
              </div>

              {/* 收藏标记 */}
              {poem.isFavorite && <span className="text-cinnabar text-sm flex-shrink-0">♥</span>}
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------
// 画廊布局（大图卡片）
// 外观：三列，封面感，标题大字居中，大面积展示
// -----------------------------------------------------------
function GalleryLayout({ poems, collection }: { poems: Poem[]; collection: Collection }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {poems.map((poem, i) => {
        const meta = getSolarTermMeta(poem.solarTerm);
        return (
          <Link key={poem.id} href={`/poem/${poem.id}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="group relative rounded-2xl overflow-hidden bg-white border border-ink/8 hover:border-ink/20 hover:shadow-lg transition-all cursor-pointer"
              style={{ minHeight: 220 }}
            >
              {/* 顶部色块（占位封面感） */}
              <div
                className="h-24 flex items-end p-4"
                style={{ background: `linear-gradient(135deg, ${collection.color}30 0%, ${collection.color}10 100%)` }}
              >
                {/* 印章 */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: collection.color, boxShadow: `0 2px 8px ${collection.color}40` }}
                >
                  {collection.seal}
                </div>
              </div>

              {/* 内容区 */}
              <div className="p-4">
                <h3 className="font-medium text-ink-dark text-base mb-2 truncate group-hover:text-cinnabar transition-colors"
                  style={{ fontFamily: "var(--font-mashan)" }}>
                  {poem.title}
                  {poem.isFavorite && <span className="ml-1 text-cinnabar"> ♥</span>}
                </h3>
                <p className="text-xs text-ink-light leading-relaxed line-clamp-3">
                  {poem.content}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-ink-light/50">
                  <span>{getSeasonName(poem.season)}季 · {meta?.name}</span>
                  <span>{formatDate(poem.createdAt).split("-")[1]}/{formatDate(poem.createdAt).split("-")[2]}</span>
                </div>
              </div>
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}
