// ============================================================
// 标签总览页（/tags）— 标签云 + 热门榜（按收藏数）
// ============================================================
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { m as motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PoemCard from "@/components/poem/PoemCard";
import { getAllPoems, updatePoem } from "@/lib/api";
import { getAllCollections } from "@/lib/db";
import { usePasswordGate } from "@/components/auth/PasswordGate";
import { cn } from "@/lib/utils";
import type { Poem, Collection } from "@/types/poem";

export default function TagsPage() {
  const { requirePassword } = usePasswordGate();
  const [poems, setPoems] = useState<Poem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tagInput, setTagInput] = useState("");
  const [applying, setApplying] = useState(false);

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

  const refresh = async () => {
    const [ps, cs] = await Promise.all([getAllPoems(), getAllCollections()]);
    setPoems(ps);
    setCollections(cs);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleBatchTag = () => {
    if (selected.size === 0 || !tagInput.trim()) return;
    const newTags = tagInput
      .split(/[,，、\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (newTags.length === 0) return;
    requirePassword(async () => {
      setApplying(true);
      for (const id of selected) {
        const poem = poems.find((p) => p.id === id);
        if (!poem) continue;
        const merged = Array.from(new Set([...(poem.tags || []), ...newTags]));
        if (merged.length === (poem.tags?.length || 0)) continue;
        try {
          await updatePoem(id, { tags: merged });
        } catch {
          // 单首失败继续
        }
      }
      setApplying(false);
      setSelected(new Set());
      setSelectMode(false);
      setTagInput("");
      await refresh();
    });
  };

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

  // 我的收藏：按个人收藏（isFavorite）过滤，兼容按 favoriteCount 排序
  const hotPoems = useMemo(() => {
    return [...poems]
      .filter((p) => p.isFavorite)
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
        <div className="text-center mb-8">
          <h1
            className="font-[var(--font-mashan)] text-4xl text-ink-dark mb-2"
            style={{ fontFamily: "var(--font-mashan)" }}
          >
            标签墨林
          </h1>
          <p className="text-ink-light text-sm">循标签而入，见诗心万象</p>
        </div>

        {/* 批量打标签工具条 */}
        {!loading && (
          <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
            {selectMode ? (
              <>
                <span className="text-sm text-ink-light">
                  已选 <span className="text-cinnabar font-medium">{selected.size}</span> 首 · 点击诗词勾选
                </span>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBatchTag()}
                  placeholder="输入标签，逗号分隔，如：秋思, 怀古"
                  aria-label="批量添加的标签"
                  className="w-64 px-3 py-1.5 rounded-full text-sm border border-ink/15 bg-white/70 outline-none focus:border-cinnabar/50"
                />
                <button
                  onClick={handleBatchTag}
                  disabled={selected.size === 0 || !tagInput.trim() || applying}
                  className={cn(
                    "text-xs px-4 py-1.5 rounded-full transition-all",
                    selected.size > 0 && tagInput.trim()
                      ? "bg-cinnabar/10 text-cinnabar hover:bg-cinnabar/15"
                      : "bg-ink/5 text-ink-light/40"
                  )}
                >
                  {applying ? "添加中..." : `添加标签`}
                </button>
                <button
                  onClick={() => { setSelectMode(false); setSelected(new Set()); setTagInput(""); }}
                  className="text-xs px-4 py-1.5 rounded-full text-ink-light hover:bg-ink/5 border border-ink/10"
                >
                  取消
                </button>
              </>
            ) : (
              <button
                onClick={() => setSelectMode(true)}
                className="text-xs px-4 py-1.5 rounded-full text-ink-light hover:bg-ink/5 border border-ink/10"
              >
                批量打标签
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton rounded-xl h-44" />
            ))}
          </div>
        ) : selectMode ? (
          /* 批量选择模式：全库诗词多选列表 */
          <section className="mb-16">
            <h2 className="text-xs text-ink-light tracking-wider uppercase mb-6 text-center">
              全库 {poems.length} 首 · 选择要打标签的诗词
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {poems.map((p) => (
                <button
                  key={p.id}
                  onClick={() => toggleSelect(p.id)}
                  className={cn(
                    "text-left p-4 rounded-xl border transition-all",
                    selected.has(p.id)
                      ? "border-cinnabar/40 bg-cinnabar/5"
                      : "border-ink/8 bg-white/50 hover:border-ink/20"
                  )}
                  aria-pressed={selected.has(p.id)}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                        selected.has(p.id) ? "bg-cinnabar border-cinnabar" : "border-ink/20"
                      )}
                    >
                      {selected.has(p.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="font-[var(--font-mashan)] text-ink-dark truncate">
                        《{p.title}》
                      </div>
                      <div className="text-xs text-ink-light truncate">
                        {p.author || "佚名"} · {(p.tags || []).length} 个标签
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {poems.length === 0 && (
              <p className="text-center text-ink-light/60 text-sm py-10">墨苑尚空，先去写诗吧</p>
            )}
          </section>
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
                  我的收藏
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
