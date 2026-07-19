// ============================================================
// 通用写诗页（/yuan/[slug]/write）
// ============================================================
"use client";

import { use, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AtmosphereLayer from "@/components/poem/AtmosphereLayer";
import { useSolarTerm } from "@/hooks/useSolarTerm";
import { useCollection } from "@/hooks/useCollection";
import { SOLAR_TERMS_META } from "@/lib/solarterms";
import { addPoem } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { SeasonKey } from "@/types/poem";
import { motion, AnimatePresence } from "framer-motion";
import { usePasswordGate } from "@/components/auth/PasswordGate";

const SEASONS: { key: SeasonKey; label: string; emoji: string }[] = [
  { key: "spring", label: "春", emoji: "🌸" },
  { key: "summer", label: "夏", emoji: "🍃" },
  { key: "autumn", label: "秋", emoji: "🍂" },
  { key: "winter", label: "冬", emoji: "❄️" },
];

interface Props {
  params: Promise<{ slug: string }>;
}

export default function CollectionWritePage({ params }: Props) {
  const { slug } = use(params);
  const router = useRouter();
  const solarTerm = useSolarTerm();
  const { collection, loading: colLoading } = useCollection(slug);
  const { requirePassword } = usePasswordGate();
  const showSeasonFields = slug === "sishi-moyuan";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [annotation, setAnnotation] = useState("");
  const [selectedSeason, setSelectedSeason] = useState<SeasonKey>(solarTerm.season);
  const [selectedSolarTerm, setSelectedSolarTerm] = useState(solarTerm.key);
  const [isVertical, setIsVertical] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const filteredSolarTerms = SOLAR_TERMS_META.filter(
    (st) => st.season === selectedSeason
  );

  const doSave = useCallback(async () => {
    if (!title.trim()) { setError("请输入诗词标题"); return; }
    if (!content.trim()) { setError("请输入诗词正文"); return; }
    if (!collection) { setError("藏不存在"); return; }

    setSaving(true);
    setError("");
    try {
      await addPoem({
        collectionId: collection.id,
        title: title.trim(),
        content: content.trim(),
        season: selectedSeason,
        solarTerm: selectedSolarTerm as any,
        annotation: annotation.trim() || undefined,
        isFavorite: false,
        favoriteCount: 0,
      });
      setSaved(true);
      setTimeout(() => router.push(`/yuan/${slug}`), 1500);
    } catch (e) {
      setError("保存失败，请重试");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [title, content, annotation, selectedSeason, selectedSolarTerm, collection, slug, router]);

  const handleSubmit = useCallback(() => {
    requirePassword(doSave);
  }, [requirePassword, doSave]);

  if (colLoading) {
    return (
      <div className="paper-texture min-h-screen">
        <Navbar />
        <main className="page-container flex items-center justify-center">
          加载中...
        </main>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="paper-texture min-h-screen">
        <Navbar />
        <main className="page-container flex items-center justify-center">
          <div className="text-center py-20">
            <h2 className="font-[var(--font-mashan)] text-2xl text-ink-dark mb-2">藏不存在</h2>
            <p className="text-ink-light text-sm mb-6">这个藏可能已被删除</p>
            <Link href="/" className="text-cinnabar text-sm hover:underline">返回墨韵阁</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="paper-texture min-h-screen">
      <AtmosphereLayer solarTerm={solarTerm} />
      <Navbar />

      <main className="page-container max-w-3xl mx-auto px-6 py-12">
        {/* 返回 */}
        <div className="mb-8">
          <Link
            href={`/yuan/${slug}`}
            className="inline-flex items-center gap-2 text-sm text-ink-light hover:text-ink transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            {collection.name}
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="font-[var(--font-mashan)] text-4xl text-ink-dark mb-2" style={{ fontFamily: "var(--font-mashan)" }}>
            落笔斋
          </h1>
          <p className="text-ink-light text-sm">为「{collection.name}」写下一首新诗</p>
        </div>

        <div className="relative">
          <div
            className="relative rounded-xl p-8 md:p-12"
            style={{
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(26,26,26,0.08)",
              boxShadow: "0 8px 40px rgba(26,26,26,0.08)",
            }}
          >
            <motion.div animate={{ scale: [0.9, 1] }} className="absolute top-6 right-6">
              <div className="seal-stamp text-sm" style={{ backgroundColor: collection.color }}>
                {collection.seal}
              </div>
            </motion.div>

            <div className="mb-8">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="诗词标题"
                className="w-full text-center font-[var(--font-mashan)] text-3xl text-ink-dark bg-transparent border-none outline-none placeholder:text-ink-light/30"
                style={{ fontFamily: "var(--font-mashan)" }}
              />
              <div
                className="h-px mt-4"
                style={{ background: `linear-gradient(to right, transparent, ${collection.color}40, transparent)` }}
              />
            </div>

            <div className="mb-8">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="在这里写下你的诗..."
                className={cn(
                  "w-full min-h-[240px] bg-transparent border-none outline-none resize-none text-ink-dark leading-loose placeholder:text-ink-light/30",
                  isVertical && "vertical-text"
                )}
                style={{
                  fontFamily: "var(--font-lxgw)",
                  fontSize: "18px",
                  lineHeight: "2.2",
                  letterSpacing: isVertical ? "0.3em" : "0.05em",
                  writingMode: isVertical ? "vertical-rl" : "horizontal-tb",
                }}
              />
            </div>

            <div className="mb-8">
              <textarea
                value={annotation}
                onChange={(e) => setAnnotation(e.target.value)}
                placeholder="写点什么作为注释或随想（可选）..."
                className="w-full min-h-[80px] bg-transparent border-none outline-none resize-none text-sm text-ink-light leading-relaxed placeholder:text-ink-light/30"
                style={{ fontFamily: "var(--font-lxgw)" }}
              />
            </div>

            <div
              className="h-px mb-8"
              style={{ background: `linear-gradient(to right, transparent, ${collection.color}40, transparent)` }}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {showSeasonFields && (<>
            <div>
              <label className="block text-xs text-ink-light mb-2 tracking-wider uppercase">季节</label>
              <div className="flex gap-2">
                {SEASONS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setSelectedSeason(s.key);
                      const first = SOLAR_TERMS_META.find((st) => st.season === s.key);
                      if (first) setSelectedSolarTerm(first.key);
                    }}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm transition-all border",
                      selectedSeason === s.key
                        ? "text-white border-transparent"
                        : "text-ink-light border-ink/10 hover:border-ink/20"
                    )}
                    style={selectedSeason === s.key ? { backgroundColor: collection.color } : undefined}
                  >
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-ink-light mb-2 tracking-wider uppercase">节气</label>
              <select
                value={selectedSolarTerm}
                onChange={(e) => setSelectedSolarTerm(e.target.value as any)}
                className="w-full py-2 px-3 rounded-lg text-sm bg-white border border-ink/10 text-ink-dark outline-none focus:border-cinnabar/40 transition-colors"
                style={{ fontFamily: "var(--font-lxgw)" }}
              >
                {filteredSolarTerms.map((st) => (
                  <option key={st.key} value={st.key}>
                    {st.name} · {st.dateRange}
                  </option>
                ))}
              </select>
            </div>
            </>)}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={() => setIsVertical(!isVertical)}
              className={cn(
                "flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-all",
                isVertical
                  ? "border-cinnabar/40 text-cinnabar bg-cinnabar/5"
                  : "border-ink/10 text-ink-light hover:border-ink/20"
              )}
            >
              {isVertical ? "竖排书写" : "横排书写"}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 text-sm text-red-500 text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => requirePassword(handleSubmit)}
              disabled={saving || saved}
              className={cn(
                "inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-medium text-white transition-all duration-300",
                saved
                  ? "bg-green-500"
                  : saving
                    ? "bg-ink/40 cursor-not-allowed"
                    : "hover:opacity-90 hover:shadow-md"
              )}
              style={{ backgroundColor: saved ? "#4ade80" : collection.color }}
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  保存中...
                </>
              ) : saved ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  已收录！
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  收录到{collection.name}
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
