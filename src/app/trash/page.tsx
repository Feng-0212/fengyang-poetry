// ============================================================
// 通用回收站（/trash）- 全藏共享，显示所有已删除诗词
// ============================================================
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getSolarTermMeta, getSeasonName } from "@/lib/solarterms";
import { getAllCollections } from "@/lib/db";
import {
  getAllPoemsIncludingDeleted,
  restorePoem,
  permanentlyDeletePoem,
} from "@/lib/api";
import { formatRelativeTime, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePasswordGate } from "@/components/auth/PasswordGate";
import type { Poem, Collection } from "@/types/poem";

export default function TrashPage() {
  const { requirePassword } = usePasswordGate();
  const [trashedPoems, setTrashedPoems] = useState<Poem[]>([]);
  const [collections, setCollections] = useState<Record<string, Collection>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const loadTrash = useCallback(async () => {
    setLoading(true);
    const [all, cols] = await Promise.all([
      getAllPoemsIncludingDeleted(),
      getAllCollections(),
    ]);
    const trashed = all
      .filter((p) => p.deletedAt)
      .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
    setTrashedPoems(trashed);
    const map: Record<string, Collection> = {};
    cols.forEach((c) => (map[c.id] = c));
    setCollections(map);
    setLoading(false);
  }, []);

  useEffect(() => { loadTrash(); }, [loadTrash]);

  const handleRestore = useCallback(async (id: string) => {
    await restorePoem(id);
    await loadTrash();
  }, [loadTrash]);

  const handleRestoreWithPassword = useCallback((id: string) => {
    requirePassword(() => handleRestore(id));
  }, [requirePassword, handleRestore]);

  const handleBatchRestoreWithPassword = useCallback(() => {
    if (selected.size === 0) return;
    if (!confirm(`确定要恢复选中的 ${selected.size} 首诗词吗？`)) return;
    requirePassword(async () => {
      for (const id of selected) await restorePoem(id);
      setSelected(new Set()); setSelectMode(false); await loadTrash();
    });
  }, [requirePassword, selected, loadTrash]);

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

  const handleBatchRestore = handleBatchRestoreWithPassword;

  const handleBatchDelete = async () => {
    if (!confirm(`确定要永久删除选中的 ${selected.size} 首诗词吗？此操作不可恢复！`)) return;
    for (const id of selected) await permanentlyDeletePoem(id);
    setSelected(new Set()); setSelectMode(false); await loadTrash();
  };

  return (
    <div className="paper-texture min-h-screen flex flex-col">
      <Navbar />
      <main className="page-container flex-1">
        <div className="max-w-3xl mx-auto px-6 py-12">
          {/* 返回墨韵阁 */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-ink-light hover:text-ink transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              墨韵阁
            </Link>
          </div>

          <div className="text-center mb-12">
            <h1 className="font-[var(--font-mashan)] text-4xl text-ink-dark mb-2">回收站</h1>
            <p className="text-ink-light text-sm">所有藏的已删诗词 · 永久删除前仍可恢复</p>
          </div>

          {/* 工具栏 */}
          {trashedPoems.length > 0 && (
            <div className="mb-6 flex items-center justify-between">
              <div className="text-sm text-ink-light">
                共 <span className="text-cinnabar font-medium">{trashedPoems.length}</span> 首
              </div>
              <div className="flex items-center gap-2">
                {selectMode ? (
                  <>
                    <button onClick={() => { setSelectMode(false); setSelected(new Set()); }} className="text-xs px-3 py-1.5 rounded-full text-ink-light hover:bg-ink/5">取消</button>
                    <button onClick={handleBatchRestore} disabled={selected.size === 0} className={cn("text-xs px-3 py-1.5 rounded-full", selected.size > 0 ? "bg-cinnabar/10 text-cinnabar hover:bg-cinnabar/15" : "bg-ink/5 text-ink-light/40")}>恢复 {selected.size}</button>
                    <button onClick={() => requirePassword(handleBatchDelete)} disabled={selected.size === 0} className={cn("text-xs px-3 py-1.5 rounded-full", selected.size > 0 ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-ink/5 text-ink-light/40")}>永久删除</button>
                  </>
                ) : (
                  <button onClick={() => setSelectMode(true)} className="text-xs px-3 py-1.5 rounded-full text-ink-light hover:bg-ink/5 border border-ink/10">批量选择</button>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-ink-light">加载中...</div>
          ) : trashedPoems.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ backgroundColor: "rgba(26,26,26,0.04)" }}>
                <svg className="w-10 h-10 text-ink-light/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <p className="text-ink-light/60 mb-4">回收站空空如也</p>
              <Link href="/" className="inline-flex items-center gap-2 text-sm text-cinnabar hover:underline">回到墨韵阁 →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {trashedPoems.map((poem) => (
                  <TrashItem
                    key={poem.id}
                    poem={poem}
                    collection={collections[poem.collectionId]}
                    selectMode={selectMode}
                    selected={selected.has(poem.id)}
                    onToggleSelect={() => toggleSelect(poem.id)}
                    onRestore={() => handleRestoreWithPassword(poem.id)}
                    onDelete={() => requirePassword(() => handlePermanentDelete(poem.id))}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          <div className="mt-8 p-4 rounded-lg bg-rice border border-ink/8 text-xs text-ink-light leading-relaxed">
            <p className="font-medium text-ink mb-1">回收站说明</p>
            <p>· 诗词删除后暂存于此，30 天后将自动清理（待实现）<br />· 永久删除需输入密码，操作不可恢复<br />· 恢复后诗词将回到原藏</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function TrashItem({
  poem,
  collection,
  selectMode,
  selected,
  onToggleSelect,
  onRestore,
  onDelete,
}: {
  poem: Poem;
  collection?: Collection;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const meta = getSolarTermMeta(poem.solarTerm);
  const themeColor = collection?.color || meta?.color || "#8B9A6B";
  const themeName = collection?.seal || meta?.name || "诗";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className={cn("p-5 rounded-xl bg-white/60 border transition-all", selected ? "border-cinnabar/40 bg-cinnabar/5" : "border-ink/8")}
    >
      <div className="flex items-start gap-4">
        {selectMode && (
          <button onClick={onToggleSelect} className={cn("mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all", selected ? "bg-cinnabar border-cinnabar" : "border-ink/20 hover:border-ink/40")}>
            {selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
          </button>
        )}
        <div className="seal-stamp text-sm flex-shrink-0" style={{ backgroundColor: themeColor, opacity: 0.5 }}>{themeName}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-[var(--font-mashan)] text-lg text-ink-dark mb-1 truncate" style={{ fontFamily: "var(--font-mashan)" }}>{poem.title}</h3>
          <p className="text-xs text-ink-light/60 mb-2">
            {collection && <span style={{ color: collection.color }}>{collection.name}</span>}
            {collection && <span className="mx-2">·</span>}
            {getSeasonName(poem.season)} · {meta?.name || poem.solarTerm}
            <span className="mx-2">·</span>
            删除于 {formatRelativeTime(poem.deletedAt || 0)}
          </p>
          <p className="text-sm text-ink-light leading-relaxed line-clamp-2">
            {poem.content.split(/[，。；！？\n]/).filter(Boolean).slice(0, 2).join("，")}
          </p>
        </div>
        {!selectMode && (
          <div className="flex flex-col gap-2">
            <button onClick={onRestore} className="text-xs px-3 py-1.5 rounded-full text-cinnabar hover:bg-cinnabar/10 transition-colors whitespace-nowrap">恢复</button>
            <button onClick={onDelete} className="text-xs px-3 py-1.5 rounded-full text-red-400 hover:bg-red-50 transition-colors whitespace-nowrap">永久删</button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
