// ============================================================
// 四时墨苑 - 诗词详情页（诵诗阁）— Phase 3 升级版
// ============================================================
"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AtmosphereLayer from "@/components/poem/AtmosphereLayer";
import ScrollUnroll, { BrushWrite } from "@/components/poem/ScrollUnroll";
import { TraditionalSeal } from "@/components/seals/SealStamp";
import TtsButton from "@/components/poem/TtsButton";
import { usePoem } from "@/hooks/usePoem";
import { useSolarTerm } from "@/hooks/useSolarTerm";
import { getCollectionById } from "@/lib/db";
import { useEffect, useState } from "react";
import type { Collection } from "@/types/poem";
import { getSolarTermMeta, getSeasonName } from "@/lib/solarterms";
import { formatDate } from "@/lib/utils";
import { deletePoem, toggleFavorite } from "@/lib/api";
import { usePasswordGate } from "@/components/auth/PasswordGate";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default function PoemDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { poem, loading, refresh: refreshPoem } = usePoem(id);
  const solarTermHook = useSolarTerm();
  const { requirePassword } = usePasswordGate();
  const [collection, setCollection] = useState<Collection | null>(null);

  useEffect(() => {
    if (poem?.collectionId) {
      getCollectionById(poem.collectionId).then((c) => setCollection(c ?? null));
    }
  }, [poem?.collectionId]);

  const backHref = collection ? `/yuan/${collection.slug}` : "/yuan/sishi-moyuan";

  if (loading) {
    return (
      <div className="paper-texture min-h-screen">
        <Navbar />
        <main className="page-container flex items-center justify-center">
          <div className="text-center">
            <div className="skeleton w-32 h-32 rounded-full mx-auto mb-4" />
            <div className="skeleton w-48 h-6 mx-auto mb-2" />
            <div className="skeleton w-64 h-4 mx-auto" />
          </div>
        </main>
      </div>
    );
  }

  if (!poem) {
    return (
      <div className="paper-texture min-h-screen">
        <Navbar />
        <main className="page-container flex items-center justify-center">
          <div className="text-center">
            <h2 className="font-[var(--font-mashan)] text-2xl text-ink-dark mb-2">
              诗词不存在
            </h2>
            <p className="text-ink-light text-sm mb-6">
              这首诗词可能已被删除
            </p>
            <a href="/" className="text-cinnabar text-sm hover:underline">
              返回首页
            </a>
          </div>
        </main>
      </div>
    );
  }

  const meta = getSolarTermMeta(poem.solarTerm);
  const seasonName = getSeasonName(poem.season);
  const sealColor = meta?.color || "#C14A3F";

  // 将正文按"句"分组（保留标点）
  const lines = poem.content
    .split(/([，。；！？\n])/g)
    .reduce<string[]>((acc, cur, i, arr) => {
      if (i % 2 === 0 && cur.trim()) {
        acc.push(cur + (arr[i + 1] || ""));
      }
      return acc;
    }, []);

  const handleDelete = async () => {
    await requirePassword(async () => {
      if (confirm("确定要删除这首诗词吗？")) {
        await deletePoem(poem.id);
        router.push(backHref);
      }
    });
  };

  const handleToggleFavorite = async () => {
    await toggleFavorite(poem.id);
    await refreshPoem();
  };

  return (
    <div className="paper-texture min-h-screen">
      <AtmosphereLayer solarTerm={meta || solarTermHook} />
      <Navbar />

      <main className="page-container relative z-10">
        <div className="max-w-2xl mx-auto px-6 py-12">
          {/* 顶部导航 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-12"
          >
            <div className="flex items-center gap-3">
              {/* 藏面包屑 */}
              {collection && (
                <Link
                  href={backHref}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all"
                  style={{ backgroundColor: `${collection.color}15`, color: collection.color }}
                >
                  <span>{collection.glyph}</span>
                  <span>{collection.name}</span>
                </Link>
              )}
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-ink-light hover:text-ink transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
                返回
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/poem/${poem.id}/edit`}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-ink/5 text-ink-light hover:bg-ink/10 hover:text-ink transition-all"
                title="编辑"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </Link>
              <button
                onClick={handleToggleFavorite}
                className={cn(
                  "rounded-full flex items-center gap-1.5 px-3 py-1.5 transition-all text-sm",
                  poem.isFavorite
                    ? "bg-cinnabar/10 text-cinnabar"
                    : "bg-ink/5 text-ink-light hover:bg-ink/10"
                )}
                title={poem.isFavorite ? "取消收藏" : "收藏"}
              >
                <span className="text-sm">♥</span>
                {poem.favoriteCount > 0 && (
                  <span className="text-xs font-medium">{poem.favoriteCount}</span>
                )}
              </button>
              <button
                onClick={handleDelete}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-ink/5 text-ink-light hover:bg-red-50 hover:text-red-400 transition-all"
                title="删除"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </motion.div>

          {/* 卷轴诗词卡片 */}
          <ScrollUnroll color={sealColor} delay={0.2}>
            <article
              className="relative"
              style={{
                background: "rgba(255,255,255,0.75)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${sealColor}20`,
                borderRadius: 8,
                boxShadow: "0 12px 60px rgba(26,26,26,0.1)",
              }}
            >
              {/* 顶部装饰条 */}
              <div
                className="h-1"
                style={{
                  background: `linear-gradient(to right, transparent, ${sealColor}60, transparent)`,
                }}
              />

              <div className="px-8 md:px-12 py-10">
                {/* 印章 + 元信息 */}
                <div className="flex items-center justify-between mb-8">
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                    style={{
                      backgroundColor: collection?.color || sealColor,
                      boxShadow: `0 4px 12px ${(collection?.color || sealColor)}30`,
                    }}
                    title={collection?.name || meta?.name}
                  >
                    {collection?.seal || meta?.name?.slice(0, 1) || "诗"}
                  </div>
                  <div className="text-right text-xs text-ink-light space-y-1">
                    <div className="text-ink-light/60">{seasonName}季</div>
                    <div>{formatDate(poem.createdAt)}</div>
                    {poem.updatedAt !== poem.createdAt && (
                      <div className="text-ink-light/40">已修改</div>
                    )}
                  </div>
                </div>

                {/* 标题 — 毛笔逐字书写 */}
                <h1
                  className="font-[var(--font-mashan)] text-3xl md:text-4xl text-ink-dark text-center mb-10"
                  style={{ fontFamily: "var(--font-mashan)" }}
                >
                  <BrushWrite
                    text={poem.title}
                    delay={1.0}
                    charDelay={0.15}
                  />
                </h1>

                {/* 作者与朝代 */}
                {(poem.author || poem.dynasty) && (
                  <div className="text-center mb-6 text-sm text-ink-light/70">
                    <span>{poem.author || "佚名"}</span>
                    {(poem.author || poem.dynasty) && <span> · </span>}
                    <span>{poem.dynasty || "佚名"}</span>
                  </div>
                )}

                {/* 朗读按钮 */}
                <motion.div
                  className="flex justify-center mb-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                >
                  <TtsButton text={`${poem.title}。${poem.author ? poem.author + "·" : ""}${poem.content}`} color={sealColor} />
                </motion.div>

                {/* 装饰线 */}
                <motion.div
                  className="h-px mb-10"
                  style={{
                    background: `linear-gradient(to right, transparent, ${sealColor}40, transparent)`,
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1.5, duration: 0.8 }}
                />

                {/* 诗词正文 — 逐字书写 */}
                <div className="mb-10 text-center">
                  {lines.map((line, lineIdx) => (
                    <div
                      key={lineIdx}
                      className="mb-2"
                      style={{
                        fontFamily: "var(--font-lxgw)",
                        lineHeight: "2.4",
                      }}
                    >
                      <BrushWrite
                        text={line}
                        delay={1.8 + lineIdx * 0.4}
                        charDelay={0.08}
                        className="text-lg md:text-xl text-ink-dark"
                      />
                    </div>
                  ))}
                </div>

                {/* 批注 */}
                {poem.annotation && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 1.8 + lines.length * 0.4 + 0.5,
                      duration: 0.6,
                    }}
                    className="annotation-area"
                  >
                    <div className="text-xs text-ink-light/60 uppercase tracking-wider mb-2">
                      随笔
                    </div>
                    <p
                      className="text-ink leading-relaxed"
                      style={{ fontFamily: "var(--font-lxgw)" }}
                    >
                      {poem.annotation}
                    </p>
                  </motion.div>
                )}

                {/* 底部装饰 */}
                <motion.div
                  className="h-px mt-10"
                  style={{
                    background: `linear-gradient(to right, transparent, ${sealColor}40, transparent)`,
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    delay: 1.8 + lines.length * 0.4 + 0.8,
                    duration: 0.8,
                  }}
                />
              </div>
            </article>
          </ScrollUnroll>

          {/* 底部操作 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="mt-8 flex justify-center gap-6"
          >
            <a
              href={collection ? `/yuan/${collection.slug}/write` : "/yuan/sishi-moyuan/write"}
              className="inline-flex items-center gap-2 text-sm text-cinnabar hover:underline"
            >
              继续写诗 →
            </a>
            <a
              href={`/poem/${poem.id}/edit`}
              className="inline-flex items-center gap-2 text-sm text-ink-light hover:text-ink"
            >
              改一改
            </a>
            <a
              href={collection ? `/yuan/${collection.slug}/bookmarks` : "/yuan/sishi-moyuan/bookmarks"}
              className="inline-flex items-center gap-2 text-sm text-ink-light hover:text-ink"
            >
              生成壁纸
            </a>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
