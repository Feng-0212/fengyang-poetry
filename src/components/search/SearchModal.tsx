// ============================================================
// 四时墨苑 - 搜索 Modal（跨藏）
// ============================================================
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import { getAllCollections } from "@/lib/db";
import { getAllPoems } from "@/lib/api";
import { getSolarTermMeta, getSeasonName } from "@/lib/solarterms";
import { cn } from "@/lib/utils";
import type { Poem, Collection } from "@/types/poem";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [allPoems, setAllPoems] = useState<Poem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载所有诗词和藏
  useEffect(() => {
    if (open) {
      getAllPoems().then(setAllPoems);
      getAllCollections().then(setCollections);
    }
  }, [open]);

  // 藏查询（按 id 索引）
  const collectionMap = useMemo(() => {
    const m = new Map<string, Collection>();
    collections.forEach((c) => m.set(c.id, c));
    return m;
  }, [collections]);

  // Fuse 搜索实例
  const fuse = useMemo(
    () =>
      new Fuse(allPoems, {
        keys: [
          { name: "title", weight: 2 },
          { name: "content", weight: 1 },
          { name: "annotation", weight: 0.5 },
        ],
        threshold: 0.3,
        ignoreLocation: true,
        includeScore: true,
      }),
    [allPoems]
  );

  const results = useMemo(() => {
    if (!query.trim()) {
      return allPoems.slice(0, 8); // 无查询时显示最近诗词
    }
    return fuse.search(query).slice(0, 10).map((r) => r.item);
  }, [query, fuse, allPoems]);

  // 自动 focus
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // 键盘导航
  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        window.location.href = `/poem/${results[selectedIndex].id}`;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, results, selectedIndex, onClose]);

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[9997]"
          />

          {/* 搜索框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-[9998] px-4"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(26,26,26,0.08)",
                boxShadow: "0 20px 60px rgba(26,26,26,0.2)",
              }}
            >
              {/* 搜索输入框 */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-ink/8">
                <svg
                  className="w-5 h-5 text-ink-light flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索诗词标题、内容或注释..."
                  className="flex-1 bg-transparent border-none outline-none text-base text-ink-dark placeholder:text-ink-light/50"
                  style={{ fontFamily: "var(--font-lxgw)" }}
                />
                <button
                  onClick={onClose}
                  className="text-xs text-ink-light px-2 py-0.5 rounded border border-ink/10 hover:bg-ink/5 transition-colors cursor-pointer"
                  title="关闭搜索"
                >
                  ESC
                </button>
              </div>

              {/* 搜索结果 */}
              <div className="max-h-[60vh] overflow-y-auto">
                {results.length === 0 ? (
                  <div className="text-center py-16 text-ink-light text-sm">
                    {allPoems.length === 0
                      ? "墨苑尚空，去写一首诗吧"
                      : "没有匹配的诗词"}
                  </div>
                ) : (
                  <div className="py-2">
                    {!query && (
                      <div className="px-5 py-2 text-xs text-ink-light/60">
                        最近诗词
                      </div>
                    )}
                    {results.map((poem, i) => {
                      const meta = getSolarTermMeta(poem.solarTerm);
                      const coll = collectionMap.get(poem.collectionId);
                      return (
                        <Link
                          key={poem.id}
                          href={`/poem/${poem.id}`}
                          onClick={onClose}
                          onMouseEnter={() => setSelectedIndex(i)}
                          className={cn(
                            "block px-5 py-3 transition-colors",
                            i === selectedIndex ? "bg-ink/5" : "hover:bg-ink/3"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="seal-stamp text-xs flex-shrink-0"
                              style={{ backgroundColor: meta?.color || "#C14A3F", width: 32, height: 32, fontSize: 12 }}
                            >
                              {meta?.name?.slice(0, 1) || "诗"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-[var(--font-mashan)] text-ink-dark truncate">{poem.title}</span>
                                {/* 藏标签 */}
                                {coll && (
                                  <span
                                    className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: `${coll.color}15`, color: coll.color }}
                                  >
                                    {coll.glyph} {coll.name}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-ink-light truncate">
                                {highlightMatch(poem.content.slice(0, 40), query)}...
                              </div>
                            </div>
                            <div className="text-xs text-ink-light/50 flex-shrink-0">{getSeasonName(poem.season)}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 底部提示 */}
              <div className="px-5 py-2.5 border-t border-ink/8 flex items-center justify-between text-xs text-ink-light/60">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded border border-ink/10 font-mono">↑↓</kbd>
                    选择
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded border border-ink/10 font-mono">↵</kbd>
                    打开
                  </span>
                  <span className="text-ink-light/40 hidden sm:inline">跨 {collections.length} 藏</span>
                </div>
                <Link
                  href={query.trim() ? `/search?q=${encodeURIComponent(query)}` : "/search"}
                  onClick={onClose}
                  className="text-cinnabar hover:underline"
                >
                  深度搜索 →
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// 高亮匹配文字
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;

  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200/60 text-ink-dark">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
