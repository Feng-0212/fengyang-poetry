// ============================================================
// 墨韵阁 - AI 工具面板（赏析 + 配图）Phase 7
// ============================================================
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Poem } from "@/types/poem";
import { generateCommentary, generateImage } from "@/lib/ai";
import { updatePoem } from "@/lib/api";

interface Props {
  poem: Poem;
  sealColor: string;
  requirePassword: (cb: () => void | Promise<void>) => void;
  onUpdated: () => void;
}

export default function AiPanel({
  poem,
  sealColor,
  requirePassword,
  onUpdated,
}: Props) {
  // 赏析
  const [loadingC, setLoadingC] = useState(false);
  const [draftC, setDraftC] = useState<string | null>(null);
  const [errC, setErrC] = useState("");

  // 配图
  const [loadingImg, setLoadingImg] = useState(false);
  const [draftImg, setDraftImg] = useState<string | null>(null);
  const [draftPromptZh, setDraftPromptZh] = useState("");
  const [errImg, setErrImg] = useState("");
  const [saving, setSaving] = useState(false);

  const runCommentary = async () => {
    setErrC("");
    setLoadingC(true);
    try {
      const text = await generateCommentary(poem);
      setDraftC(text);
    } catch (e) {
      setErrC(e instanceof Error ? e.message : "生成失败");
    } finally {
      setLoadingC(false);
    }
  };

  const saveCommentary = async () => {
    if (!draftC) return;
    await requirePassword(async () => {
      setSaving(true);
      try {
        await updatePoem(poem.id, { aiCommentary: draftC });
        setDraftC(null);
        onUpdated();
      } finally {
        setSaving(false);
      }
    });
  };

  const runImage = async () => {
    setErrImg("");
    setLoadingImg(true);
    try {
      const r = await generateImage(poem);
      setDraftImg(r.image);
      setDraftPromptZh(r.promptZh || "");
    } catch (e) {
      setErrImg(e instanceof Error ? e.message : "生成失败");
    } finally {
      setLoadingImg(false);
    }
  };

  const saveCover = async () => {
    if (!draftImg) return;
    await requirePassword(async () => {
      setSaving(true);
      try {
        await updatePoem(poem.id, { coverImage: draftImg });
        setDraftImg(null);
        onUpdated();
      } finally {
        setSaving(false);
      }
    });
  };

  const downloadImage = () => {
    if (!draftImg) return;
    const a = document.createElement("a");
    a.href = draftImg;
    a.download = `${poem.title || "配图"}.png`;
    a.click();
  };

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={runCommentary}
        disabled={loadingC}
        className="inline-flex items-center gap-1.5 text-sm text-ink-light hover:text-cinnabar transition-colors disabled:opacity-50"
      >
        {loadingC ? "赏析中…" : "✨ AI 赏析"}
      </button>
      <button
        onClick={runImage}
        disabled={loadingImg}
        className="inline-flex items-center gap-1.5 text-sm text-ink-light hover:text-cinnabar transition-colors disabled:opacity-50"
      >
        {loadingImg ? "作画中…" : "🖼️ AI 配图"}
      </button>

      {/* 错误提示 */}
      {(errC || errImg) && (
        <div className="w-full text-center text-xs text-red-400 mt-1">
          {errC || errImg}
        </div>
      )}

      {/* 赏析草稿面板 */}
      <AnimatePresence>
        {draftC && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="w-full max-w-xl mx-auto mt-6 rounded-xl border bg-white/80 p-5 text-left"
            style={{ borderColor: `${sealColor}30` }}
          >
            <div className="text-xs text-ink-light/60 uppercase tracking-wider mb-2">
              AI 赏析 · 草稿
            </div>
            <p
              className="text-ink leading-relaxed mb-4"
              style={{ fontFamily: "var(--font-lxgw)" }}
            >
              {draftC}
            </p>
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                onClick={runCommentary}
                disabled={loadingC}
                className="px-3 py-1.5 rounded-lg border border-ink/15 text-xs text-ink-light hover:bg-ink/5 disabled:opacity-50"
              >
                {loadingC ? "…" : "重新生成"}
              </button>
              <button
                onClick={() => setDraftC(null)}
                className="px-3 py-1.5 rounded-lg border border-ink/15 text-xs text-ink-light hover:bg-ink/5"
              >
                放弃
              </button>
              <button
                onClick={saveCommentary}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-cinnabar text-white text-xs font-medium hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "保存中…" : "保存到本诗"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 配图模态 */}
      <AnimatePresence>
        {draftImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setDraftImg(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-rice rounded-2xl overflow-hidden max-w-md w-full shadow-2xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={draftImg}
                alt={poem.title}
                loading="lazy"
                decoding="async"
                className="w-full aspect-square object-cover"
              />
              <div className="p-4">
                <div className="text-sm text-ink-dark font-medium mb-2 text-center">
                  《{poem.title}》· AI 配图
                </div>
                {draftPromptZh && (
                  <p className="text-xs text-ink-light/70 leading-relaxed mb-3 max-h-24 overflow-y-auto rounded-lg bg-ink/5 p-2">
                    {draftPromptZh}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={runImage}
                    disabled={loadingImg}
                    className="px-3 py-2 rounded-lg border border-ink/15 text-xs text-ink-light hover:bg-ink/5 disabled:opacity-50"
                  >
                    {loadingImg ? "…" : "重新生成"}
                  </button>
                  <button
                    onClick={downloadImage}
                    className="px-3 py-2 rounded-lg border border-ink/15 text-xs text-ink-light hover:bg-ink/5"
                  >
                    下载
                  </button>
                  <button
                    onClick={saveCover}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-cinnabar text-white text-xs font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? "保存中…" : "设为配图"}
                  </button>
                  <button
                    onClick={() => setDraftImg(null)}
                    className="px-3 py-2 rounded-lg text-xs text-ink-light hover:bg-ink/5"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
