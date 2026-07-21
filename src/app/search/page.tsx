// ============================================================
// 四时墨苑 - 跨藏搜索页（/search）
// ============================================================
"use client";

import { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getAllCollections } from "@/lib/db";
import { getAllPoems as getAllPoemsApi } from "@/lib/api";
import { getSolarTermMeta, getSeasonName } from "@/lib/solarterms";
import { cn } from "@/lib/utils";
import type { Poem, Collection, SeasonKey } from "@/types/poem";

const SEASON_LABELS: Record<string, string> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
};

const SEASON_ICONS: Record<string, string> = {
  spring: "🌸",
  summer: "☀️",
  autumn: "🍂",
  winter: "❄️",
};

const STORAGE_KEY = "poetry_recent_searches";
const SAMPLE_QUERIES = ["春", "月", "酒", "山", "夜", "风", "相思", "落", "归"];

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  );
}

function SearchLoading() {
  return (
    <div className="paper-texture min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 page-container">
        <div className="max-w-5xl mx-auto px-6 py-10 text-center text-ink-light">加载中...</div>
      </main>
      <Footer />
    </div>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [allPoems, setAllPoems] = useState<Poem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [selectedSeasons, setSelectedSeasons] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<"collection" | "season" | "none">("collection");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // 加载数据（诗从云端 API，与设置页同步）
  useEffect(() => {
    getAllPoemsApi().then((p) => setAllPoems(p as unknown as Poem[]));
    getAllCollections().then(setCollections);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setRecentSearches(JSON.parse(stored).slice(0, 5)); } catch {}
    }
  }, []);

  // 同步 URL query
  useEffect(() => {
    if (query !== initialQuery) {
      const params = new URLSearchParams(searchParams);
      if (query) params.set("q", query);
      else params.delete("q");
      const newUrl = params.toString() ? `/search?${params}` : "/search";
      router.replace(newUrl, { scroll: false });
    }
  }, [query, initialQuery, router, searchParams]);

  // 保存最近搜索
  const saveSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[];
    const filtered = stored.filter((s) => s !== q);
    const updated = [q, ...filtered].slice(0, 5);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecentSearches(updated);
  }, []);

  // Fuse 实例
  const fuse = useMemo(
    () =>
      new Fuse(allPoems, {
        keys: [
          { name: "title", weight: 3 },
          { name: "content", weight: 2 },
          { name: "annotation", weight: 1 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
        includeScore: true,
      }),
    [allPoems]
  );

  // 搜索结果
  const matchedPoems = useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query).map((r) => r.item);
  }, [query, fuse]);

  // 应用筛选
  const filteredPoems = useMemo(() => {
    let result = matchedPoems;
    if (selectedCollections.size > 0) {
      result = result.filter((p) => selectedCollections.has(p.collectionId));
    }
    if (selectedSeasons.size > 0) {
      result = result.filter((p) => selectedSeasons.has(p.season));
    }
    return result;
  }, [matchedPoems, selectedCollections, selectedSeasons]);

  // 按藏分组
  const groupedByCollection = useMemo(() => {
    const map = new Map<string, Poem[]>();
    for (const p of filteredPoems) {
      if (!map.has(p.collectionId)) map.set(p.collectionId, []);
      map.get(p.collectionId)!.push(p);
    }
    return map;
  }, [filteredPoems]);

  // 按季节分组
  const groupedBySeason = useMemo(() => {
    const map = new Map<string, Poem[]>();
    for (const p of filteredPoems) {
      if (!map.has(p.season)) map.set(p.season, []);
      map.get(p.season)!.push(p);
    }
    return map;
  }, [filteredPoems]);

  const collectionMap = useMemo(() => {
    const m = new Map<string, Collection>();
    collections.forEach((c) => m.set(c.id, c));
    return m;
  }, [collections]);

  // 切换藏筛选
  const toggleCollection = (id: string) => {
    const newSet = new Set(selectedCollections);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedCollections(newSet);
  };

  // 切换季节筛选
  const toggleSeason = (s: string) => {
    const newSet = new Set(selectedSeasons);
    newSet.has(s) ? newSet.delete(s) : newSet.add(s);
    setSelectedSeasons(newSet);
  };

  // 清空筛选
  const clearFilters = () => {
    setSelectedCollections(new Set());
    setSelectedSeasons(new Set());
  };

  // 提交搜索（保存到历史）
  const handleSearch = (q: string) => {
    setQuery(q);
    if (q.trim()) saveSearch(q);
  };

  const hasFilters = selectedCollections.size > 0 || selectedSeasons.size > 0;
  const totalResults = filteredPoems.length;
  const matchedCollections = new Set(filteredPoems.map((p) => p.collectionId));

  return (
    <div className="paper-texture min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 page-container">
        <div className="max-w-5xl mx-auto px-6 py-10">
          {/* 顶部 Hero */}
          <div className="mb-8">
            <h1 className="font-[var(--font-mashan)] text-4xl text-ink-dark mb-2" style={{ fontFamily: "var(--font-mashan)" }}>
              跨藏搜索
            </h1>
            <p className="text-ink-light text-sm">穿越 6 藏 · 共 {allPoems.length} 首诗词</p>
          </div>

          {/* 搜索框 */}
          <div className="mb-6">
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white border border-ink/10 focus-within:border-cinnabar/40 transition-colors" style={{ boxShadow: "0 4px 24px rgba(26,26,26,0.05)" }}>
              <svg className="w-5 h-5 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索诗词标题、内容或注释..."
                className="flex-1 bg-transparent border-none outline-none text-lg text-ink-dark placeholder:text-ink-light/40"
                style={{ fontFamily: "var(--font-lxgw)" }}
                autoFocus
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-ink-light/60 hover:text-ink-light">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* 搜索建议 */}
            {!query && (
              <div className="mt-4">
                <div className="text-xs text-ink-light/50 mb-2">试试搜索：</div>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_QUERIES.map((q) => (
                    <button key={q} onClick={() => handleSearch(q)} className="text-sm px-3 py-1 rounded-full border border-ink/10 text-ink-light hover:border-ink/20 hover:text-ink transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
                {recentSearches.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs text-ink-light/50 mb-2">最近搜索：</div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((q) => (
                        <button key={q} onClick={() => handleSearch(q)} className="text-sm px-3 py-1 rounded-full bg-ink/5 text-ink-light hover:bg-ink/10 transition-colors">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 主内容：左筛选 + 右结果 */}
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
            {/* 左侧：筛选 */}
            <aside>
              {/* 藏筛选 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs text-ink-light tracking-wider uppercase">藏</h3>
                  {hasFilters && (
                    <button onClick={clearFilters} className="text-[10px] text-cinnabar hover:underline">清空</button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {collections.map((c) => {
                    const isSelected = selectedCollections.has(c.id);
                    const count = matchedPoems.filter((p) => p.collectionId === c.id).length;
                    return (
                      <label
                        key={c.id}
                        className={cn("flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-sm", isSelected ? "bg-ink/5" : "hover:bg-ink/3")}
                      >
                        <div className={cn("w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0", isSelected ? "border-transparent" : "border-ink/20")}
                          style={isSelected ? { backgroundColor: c.color } : undefined}>
                          {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleCollection(c.id)} className="hidden" />
                        <span className="flex-shrink-0">{c.glyph}</span>
                        <span className="flex-1 truncate text-ink-dark">{c.name}</span>
                        {query && <span className="text-xs text-ink-light/50">{count}</span>}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 季节筛选 */}
              <div className="mb-6">
                <h3 className="text-xs text-ink-light mb-3 tracking-wider uppercase">季节</h3>
                <div className="space-y-1.5">
                  {(["spring", "summer", "autumn", "winter"] as const).map((s) => {
                    const isSelected = selectedSeasons.has(s);
                    return (
                      <label
                        key={s}
                        className={cn("flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-sm", isSelected ? "bg-ink/5" : "hover:bg-ink/3")}
                      >
                        <div className={cn("w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0", isSelected ? "border-ink/40 bg-ink/80" : "border-ink/20")}>
                          {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSeason(s)} className="hidden" />
                        <span className="flex-shrink-0">{SEASON_ICONS[s]}</span>
                        <span className="text-ink-dark">{SEASON_LABELS[s]}季</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 排序方式 */}
              {query && totalResults > 0 && (
                <div>
                  <h3 className="text-xs text-ink-light mb-3 tracking-wider uppercase">分组</h3>
                  <div className="space-y-1.5">
                    {([
                      { k: "collection", l: "按藏" },
                      { k: "season", l: "按季" },
                      { k: "none", l: "无" },
                    ] as const).map((opt) => (
                      <label key={opt.k} className={cn("flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors", groupBy === opt.k ? "bg-ink/5" : "hover:bg-ink/3")}>
                        <div className={cn("w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors", groupBy === opt.k ? "border-cinnabar" : "border-ink/20")}>
                          {groupBy === opt.k && <div className="w-1.5 h-1.5 rounded-full bg-cinnabar" />}
                        </div>
                        <input type="radio" name="groupBy" checked={groupBy === opt.k} onChange={() => setGroupBy(opt.k)} className="hidden" />
                        <span className="text-ink-dark">{opt.l}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            {/* 右侧：结果 */}
            <div>
              {!query ? (
                <EmptyState total={allPoems.length} collections={collections.length} />
              ) : totalResults === 0 ? (
                <NoResults query={query} onClear={() => setQuery("")} hasFilters={hasFilters} onClearFilters={clearFilters} />
              ) : (
                <>
                  {/* 结果统计 */}
                  <div className="mb-4 flex items-center justify-between text-sm text-ink-light">
                    <div>
                      找到 <span className="text-ink-dark font-medium">{totalResults}</span> 首
                      {matchedCollections.size > 1 && (
                        <span className="ml-1">，来自 <span className="text-ink-dark font-medium">{matchedCollections.size}</span> 藏</span>
                      )}
                    </div>
                    {hasFilters && (
                      <button onClick={clearFilters} className="text-xs text-cinnabar hover:underline">清空筛选</button>
                    )}
                  </div>

                  {/* 分组结果 */}
                  {groupBy === "collection" ? (
                    <div className="space-y-6">
                      {Array.from(groupedByCollection.entries()).map(([collId, poems]) => {
                        const coll = collectionMap.get(collId);
                        if (!coll) return null;
                        return (
                          <div key={collId}>
                            <div className="flex items-center gap-2 mb-3">
                              <span>{coll.glyph}</span>
                              <Link href={`/yuan/${coll.slug}`} className="font-medium text-ink-dark hover:underline">
                                {coll.name}
                              </Link>
                              <span className="text-xs text-ink-light/50">· {poems.length} 首</span>
                            </div>
                            <div className="space-y-2">
                              {poems.map((poem) => (
                                <ResultCard key={poem.id} poem={poem} query={query} collection={coll} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : groupBy === "season" ? (
                    <div className="space-y-6">
                      {Array.from(groupedBySeason.entries()).map(([season, poems]) => (
                        <div key={season}>
                          <div className="flex items-center gap-2 mb-3 text-ink-dark font-medium">
                            <span>{SEASON_ICONS[season]}</span>
                            <span>{SEASON_LABELS[season]}季</span>
                            <span className="text-xs text-ink-light/50">· {poems.length} 首</span>
                          </div>
                          <div className="space-y-2">
                            {poems.map((poem) => (
                              <ResultCard key={poem.id} poem={poem} query={query} collection={collectionMap.get(poem.collectionId)!} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredPoems.map((poem) => (
                        <ResultCard key={poem.id} poem={poem} query={query} collection={collectionMap.get(poem.collectionId)!} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ============================================================
// 结果卡片
// ============================================================
function ResultCard({
  poem, query, collection,
}: { poem: Poem; query: string; collection?: Collection }) {
  const meta = getSolarTermMeta(poem.solarTerm);
  return (
    <Link href={`/poem/${poem.id}`}>
      <article className="group p-4 rounded-xl bg-white/60 border border-ink/8 hover:border-ink/20 hover:bg-white/80 transition-all">
        <div className="flex items-start gap-3">
          <div className="seal-stamp text-xs flex-shrink-0" style={{ backgroundColor: meta?.color || "#C14A3F" }}>
            {meta?.name?.slice(0, 1) || "诗"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-[var(--font-mashan)] text-ink-dark truncate group-hover:text-cinnabar transition-colors">
                {highlightMatch(poem.title, query)}
              </h3>
              {collection && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: `${collection.color}15`, color: collection.color }}
                >
                  {collection.glyph} {collection.name}
                </span>
              )}
              {poem.isFavorite && <span className="text-cinnabar text-xs">♥</span>}
            </div>
            <p className="text-sm text-ink-light leading-relaxed line-clamp-2">
              {highlightMatch(poem.content, query)}
            </p>
            <div className="text-xs text-ink-light/50 mt-1.5 flex items-center gap-3">
              <span>{getSeasonName(poem.season)}季</span>
              <span>·</span>
              <span>{meta?.name || "—"}</span>
              {poem.annotation && (
                <>
                  <span>·</span>
                  <span className="truncate max-w-[200px]">{poem.annotation}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ============================================================
// 高亮匹配
// ============================================================
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200/60 text-ink-dark px-0.5 rounded">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ============================================================
// 空状态
// ============================================================
function EmptyState({ total, collections }: { total: number; collections: number }) {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-6 opacity-40">🔍</div>
      <h3 className="font-[var(--font-mashan)] text-xl text-ink-dark mb-2">输入关键词开始搜索</h3>
      <p className="text-ink-light text-sm mb-1">在 {collections} 个藏、{total} 首诗词中</p>
      <p className="text-ink-light/50 text-xs">支持标题、正文、注释的模糊匹配</p>
    </div>
  );
}

function NoResults({
  query, onClear, hasFilters, onClearFilters,
}: { query: string; onClear: () => void; hasFilters: boolean; onClearFilters: () => void }) {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-6 opacity-30">📭</div>
      <h3 className="font-[var(--font-mashan)] text-xl text-ink-dark mb-2">没有找到「{query}」相关的诗词</h3>
      <p className="text-ink-light text-sm mb-6">试试其他关键词</p>
      <div className="flex justify-center gap-2">
        <button onClick={onClear} className="text-sm px-4 py-1.5 rounded-full bg-ink/5 text-ink-light hover:bg-ink/10 transition-colors">
          换关键词
        </button>
        {hasFilters && (
          <button onClick={onClearFilters} className="text-sm px-4 py-1.5 rounded-full bg-ink/5 text-ink-light hover:bg-ink/10 transition-colors">
            清空筛选
          </button>
        )}
      </div>
    </div>
  );
}
