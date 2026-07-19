// ============================================================
// 四时墨苑 - 编辑诗词页
// ============================================================
"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { usePoem } from "@/hooks/usePoem";
import { useSolarTerm } from "@/hooks/useSolarTerm";
import { SOLAR_TERMS_META } from "@/lib/solarterms";
import { updatePoem } from "@/lib/api";
import { getCollectionById } from "@/lib/db";
import { COLLECTION_IDS } from "@/types/poem";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePasswordGate } from "@/components/auth/PasswordGate";
import type { SeasonKey, SolarTermKey, Collection } from "@/types/poem";

const SEASONS: { key: SeasonKey; label: string; emoji: string }[] = [
  { key: "spring", label: "春", emoji: "🌸" },
  { key: "summer", label: "夏", emoji: "🍃" },
  { key: "autumn", label: "秋", emoji: "🍂" },
  { key: "winter", label: "冬", emoji: "❄️" },
];

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditPoemPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { poem, loading } = usePoem(id);
  const solarTermHook = useSolarTerm();
  const { requirePassword } = usePasswordGate();

  // 获取诗词所在藏
  const [collection, setCollection] = useState<Collection | null>(null);
  useEffect(() => {
    if (poem?.collectionId) {
      getCollectionById(poem.collectionId).then((c) => setCollection(c ?? null));
    }
  }, [poem?.collectionId]);

  // 仅四时墨苑显示节气字段
  const isSishiMoyuan = collection?.slug === COLLECTION_IDS.SISHI_MOYUAN;
  const themeColor = collection?.color || solarTermHook.color;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [annotation, setAnnotation] = useState("");
  const [selectedSeason, setSelectedSeason] = useState<SeasonKey>("spring");
  const [selectedSolarTerm, setSelectedSolarTerm] =
    useState<SolarTermKey>("lichun");
  const [isVertical, setIsVertical] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (poem) {
      setTitle(poem.title);
      setContent(poem.content);
      setAnnotation(poem.annotation || "");
      setSelectedSeason(poem.season);
      setSelectedSolarTerm(poem.solarTerm);
    }
  }, [poem]);

  // 跟踪修改
  useEffect(() => {
    if (!poem) return;
    const changed =
      title !== poem.title ||
      content !== poem.content ||
      (annotation || "") !== (poem.annotation || "") ||
      selectedSeason !== poem.season ||
      selectedSolarTerm !== poem.solarTerm;
    setHasChanges(changed);
  }, [poem, title, content, annotation, selectedSeason, selectedSolarTerm]);

  const filteredSolarTerms = SOLAR_TERMS_META.filter(
    (st) => st.season === selectedSeason
  );
  const selectedTermMeta =
    SOLAR_TERMS_META.find((st) => st.key === selectedSolarTerm) ?? SOLAR_TERMS_META[0];
  const displayTerm = isSishiMoyuan ? selectedTermMeta : solarTermHook;

  const handleSubmit = useCallback(() => {
    requirePassword(async () => {
      if (!poem) return;
      if (!title.trim()) { setError("请输入诗词标题"); return; }
      if (!content.trim()) { setError("请输入诗词正文"); return; }

      setSaving(true);
      setError("");

      try {
        await updatePoem(poem.id, {
          title: title.trim(),
          content: content.trim(),
          season: selectedSeason,
          solarTerm: selectedSolarTerm,
          annotation: annotation.trim() || undefined,
        });
        setSaved(true);
        setTimeout(() => router.push(`/poem/${poem.id}`), 1200);
      } catch (e) {
        setError("保存失败，请重试");
        console.error(e);
      } finally {
        setSaving(false);
      }
    });
  }, [requirePassword, poem, title, content, annotation, selectedSeason, selectedSolarTerm, router]);

  if (loading) {
    return (
      <div className="paper-texture min-h-screen">
        <Navbar />
        <main className="page-container flex items-center justify-center">
          <div className="text-center text-ink-light">加载中...</div>
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
            <Link href="/" className="text-cinnabar text-sm hover:underline">
              返回首页
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="paper-texture min-h-screen">
      <Navbar />

      <main className="page-container max-w-3xl mx-auto px-6 py-12">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="font-[var(--font-mashan)] text-4xl text-ink-dark mb-2">
            改诗斋
          </h1>
          <p className="text-ink-light text-sm">
            一字之差，意境千里
          </p>
        </div>

        {/* 写作区 */}
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
            {/* 当令印章（右上角） */}
            <motion.div
              animate={{ scale: [0.9, 1] }}
              className="absolute top-6 right-6"
            >
              <div
                className="seal-stamp text-sm"
                style={{ backgroundColor: displayTerm.color }}
              >
                {displayTerm.name}
              </div>
            </motion.div>

            {/* 修改提示徽章 */}
            {hasChanges && (
              <div className="absolute top-6 left-6 text-xs text-ink-light/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                未保存
              </div>
            )}

            {/* 标题输入 */}
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
                style={{
                  background: `linear-gradient(to right, transparent, ${displayTerm.color}40, transparent)`,
                }}
              />
            </div>

            {/* 正文输入 */}
            <div className="mb-8">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="在这里写下你的诗..."
                className="w-full min-h-[240px] bg-transparent border-none outline-none resize-none text-ink-dark leading-loose placeholder:text-ink-light/30"
                style={{
                  fontFamily: "var(--font-lxgw)",
                  fontSize: "18px",
                  lineHeight: "2.2",
                  letterSpacing: isVertical ? "0.3em" : "0.05em",
                  writingMode: isVertical ? "vertical-rl" : "horizontal-tb",
                }}
              />
            </div>

            {/* 批注输入 */}
            <div className="mb-8">
              <textarea
                value={annotation}
                onChange={(e) => setAnnotation(e.target.value)}
                placeholder="写点什么作为注释或随想（可选）..."
                className="w-full min-h-[80px] bg-transparent border-none outline-none resize-none text-sm text-ink-light leading-relaxed placeholder:text-ink-light/30"
                style={{ fontFamily: "var(--font-lxgw)" }}
              />
            </div>

            {/* 分割线 */}
            <div
              className="h-px mb-8"
              style={{
                background: `linear-gradient(to right, transparent, ${displayTerm.color}40, transparent)`,
              }}
            />
          </div>

          {/* 季节 & 节气选择（仅四时墨苑显示） */}
          {isSishiMoyuan && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-ink-light mb-2 tracking-wider uppercase">
                季节
              </label>
              <div className="flex gap-2">
                {SEASONS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setSelectedSeason(s.key);
                      const first = SOLAR_TERMS_META.find(
                        (st) => st.season === s.key
                      );
                      if (first) setSelectedSolarTerm(first.key);
                    }}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm transition-all duration-200 border",
                      selectedSeason === s.key
                        ? "text-white border-transparent"
                        : "text-ink-light border-ink/10 hover:border-ink/20"
                    )}
                    style={
                      selectedSeason === s.key
                        ? { backgroundColor: displayTerm.color }
                        : undefined
                    }
                  >
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-ink-light mb-2 tracking-wider uppercase">
                节气
              </label>
              <select
                value={selectedSolarTerm}
                onChange={(e) =>
                  setSelectedSolarTerm(e.target.value as SolarTermKey)
                }
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
          </div>
          )}

          {/* 书写方向切换 */}
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
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
              {isVertical ? "竖排书写" : "横排书写"}
            </button>

            {/* 字数统计 */}
            <div className="text-xs text-ink-light/60">
              字数：{content.length}
            </div>
          </div>

          {/* 错误提示 */}
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

          {/* 操作按钮 */}
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href={`/poem/${poem.id}`}
              className="px-6 py-3 rounded-lg text-sm font-medium border border-ink/20 text-ink transition-all duration-300 hover:border-ink/40 hover:bg-ink/5"
            >
              取消
            </Link>
            <button
              onClick={() => requirePassword(handleSubmit)}
              disabled={saving || saved || !hasChanges}
              className={cn(
                "inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-medium text-white transition-all duration-300",
                saved
                  ? "bg-green-500"
                  : !hasChanges
                  ? "bg-ink/30 cursor-not-allowed"
                  : saving
                  ? "bg-ink/40 cursor-not-allowed"
                  : "hover:opacity-90 hover:shadow-md"
              )}
              style={{ backgroundColor: saved ? "#4ade80" : "#C14A3F" }}
            >
              {saving ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  保存中...
                </>
              ) : saved ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  已保存
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  保存修改
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
