// ============================================================
// 四时墨苑 - 回收站（/yuan/sishi-moyuan/trash）
// ============================================================
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getSolarTermMeta, getSeasonName } from "@/lib/solarterms";
import { db, permanentlyDeletePoem, updatePoem } from "@/lib/db";
import { cn, formatRelativeTime } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Poem } from "@/types/poem";
import { COLLECTION_IDS } from "@/types/poem";

export default function TrashPage() {
  const [trashedPoems, setTrashedPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const loadTrash = useCallback(async () => {
    setLoading(true);
    const all = await db.poems.toArray();
    const trashed = all
      .filter((p) => p.deletedAt && p.collectionId === COLLECTION_IDS.SISHI_MOYUAN)
      .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
    setTrashedPoems(trashed);
    setLoading(false);
  }, []);

  useEffect(() => { loadTrash(); }, [loadTrash]);

  const handleRestore = useCallback(async (id: string) => {
    await updatePoem(id, { deletedAt: undefined });
    await loadTrash();
  }, [loadTrash]);

  const handlePermanentDelete = useCallback(async (id: string) => {
    if (!confirm("确定要永久删除这首诗词吗？此操作不可恢复。")) return;
    await permanentlyDeletePoem(id);
    await loadTrash();
  }, [loadTrash]);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selected);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelected(newSet);
  };

  const handleBatchRestore = async () => {
    if (!confirm(`确定要恢复选中的 ${selected.size} 首诗词吗？`)) return;
    for (const id of selected) await updatePoem(id, { deletedAt: undefined });
    setSelected(new Set()); setSelectMode(false); await loadTrash();
  };

  const handleBatchDelete = async () => {
    if (!confirm(`确定要永久删除选中的 ${selected.size} 首诗词吗？此操作不可恢复！`)) return;
    for (const id of selected) await permanentlyDeletePoem(id);
    setSelected(new Set()); setSelectMode(false); await loadTrash();
  };

  const handleEmptyTrash = async () => {
    if (!confirm(`确定要永久清空回收站中的 ${trashedPoems.length} 首诗词吗？此操作不可恢复！`)) return;
    for (const p of trashedPoems) await permanentlyDeletePoem(p.id);
    await loadTrash();
  };

  return (
    <div className="paper-texture min-h-screen">
      <Navbar />
      <main className="page-container max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/yuan/sishi-moyuan" className="inline-flex items-center gap-2 text-sm text-ink-light hover:text-ink transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
            四时墨苑
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="font-[var(--font-mashan)] text-4xl text-ink-dark mb-2">墨苑回收</h1>
          <p className="text-ink-light text-sm">30天内可恢复，逾期将永久删除</p>
        </div>

        {trashedPoems.length > 0 && (
          <div className="flex items-center justify-between mb-6 p-4 rounded-lg bg-white/60 border border-ink/8">
            <div className="flex items-center gap-3">
              <button onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
                className={cn("text-sm px-3 py-1.5 rounded-md transition-colors", selectMode ? "bg-cinnabar/10 text-cinnabar" : "text-ink-light hover:bg-ink/5")}>
                {selectMode ? "取消选择" : "批量操作"}
              </button>
              {selectMode && selected.size > 0 && <>
                <span className="text-sm text-ink-light">已选 {selected.size} 首</span>
                <button onClick={handleBatchRestore} className="text-sm px-3 py-1.5 rounded-md text-green-600 hover:bg-green-50">批量恢复</button>
                <button onClick={handleBatchDelete} className="text-sm px-3 py-1.5 rounded-md text-red-500 hover:bg-red-50">批量删除</button>
              </>}
            </div>
            <button onClick={handleEmptyTrash} className="text-sm text-red-500 hover:text-red-600">清空回收站</button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-ink-light">加载中...</div>
        ) : trashedPoems.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ backgroundColor: "rgba(26,26,26,0.04)" }}>
              <svg className="w-10 h-10 text-ink-light/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="font-[var(--font-mashan)] text-xl text-ink-dark mb-2">回收站是空的</h3>
            <p className="text-ink-light text-sm mb-6">没有待恢复的诗词</p>
            <Link href="/yuan/sishi-moyuan" className="inline-flex items-center gap-2 text-sm text-cinnabar hover:underline">回到四时墨苑 →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {trashedPoems.map((poem, i) => {
                const meta = getSolarTermMeta(poem.solarTerm);
                const isSelected = selected.has(poem.id);
                return (
                  <motion.div key={poem.id}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn("p-4 rounded-lg border transition-all", isSelected ? "border-cinnabar/40 bg-cinnabar/5" : "border-ink/8 bg-white/50")}>
                    <div className="flex items-center gap-4">
                      {selectMode && (
                        <button onClick={() => toggleSelect(poem.id)}
                          className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                            isSelected ? "border-cinnabar bg-cinnabar" : "border-ink/20 hover:border-ink/40")}>
                          {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </button>
                      )}
                      <div className="seal-stamp text-sm flex-shrink-0" style={{ backgroundColor: meta?.color||"#C14A3F", opacity: 0.5 }}>{meta?.name||"诗"}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-[var(--font-mashan)] text-ink-dark truncate" style={{ opacity: 0.7 }}>{poem.title}</h3>
                          <span className="text-xs text-ink-light/50">{getSeasonName(poem.season)}</span>
                        </div>
                        <p className="text-sm text-ink-light truncate" style={{ opacity: 0.6 }}>{poem.content.slice(0, 60)}...</p>
                        <div className="text-xs text-ink-light/40 mt-1">删除于 {formatRelativeTime(poem.deletedAt || 0)}</div>
                      </div>
                      {!selectMode && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => handleRestore(poem.id)} className="text-sm px-3 py-1.5 rounded-md text-green-600 hover:bg-green-50 transition-colors">恢复</button>
                          <button onClick={() => handlePermanentDelete(poem.id)} className="text-sm px-3 py-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors">永久删除</button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {trashedPoems.length > 0 && (
          <div className="mt-8 text-center text-xs text-ink-light/50">
            <p>诗词在被删除30天后将自动清理</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
