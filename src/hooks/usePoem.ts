// ============================================================
// 四时墨苑 - usePoem Hook（API 共享数据 + IndexedDB 本地缓存）
// ============================================================
"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db";
import type { Poem } from "@/types/poem";
import { getAllPoems, getPoem } from "@/lib/api";

// 将 API 数据回写本地 IndexedDB 做缓存
async function cachePoems(poems: Poem[]) {
  try {
    await db.poems.bulkPut(poems);
  } catch {}
}

/**
 * 获取单个诗词
 */
export function usePoem(id: string) {
  const [poem, setPoem] = useState<Poem | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await getPoem(id);
      setPoem(p);
      if (p) {
        try {
          // 回写本地缓存
          const existing = await db.poems.get(id);
          if (existing) await db.poems.update(id, p);
          else await db.poems.add(p);
        } catch {}
      }
    } catch {
      // 降级到 IndexedDB
      const found = await db.poems.get(id);
      setPoem(found || null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return { poem, loading, refresh: load };
}

/**
 * 获取诗词列表（API 优先，IndexedDB 降级）
 */
export function usePoems(collectionId?: string) {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!collectionId) {
      setPoems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const all = await getAllPoems();
      const filtered = all.filter((p) => p.collectionId === collectionId);
      setPoems(filtered);
      // 后台回写缓存
      cachePoems(all);
    } catch {
      // 降级到 IndexedDB
      const all = await db.poems.toArray();
      const active = all.filter((p) => !p.deletedAt);
      const filtered = active.filter((p) => p.collectionId === collectionId);
      filtered.sort((a, b) => b.createdAt - a.createdAt);
      setPoems(filtered);
    }
    setLoading(false);
  }, [collectionId]);

  useEffect(() => { load(); }, [load]);

  return { poems, loading, refresh: load };
}

/**
 * 获取收藏诗词
 */
export function useFavoritePoems(collectionId?: string) {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllPoems();
      const fav = all.filter((p) => p.isFavorite);
      const filtered = collectionId
        ? fav.filter((p) => p.collectionId === collectionId)
        : fav;
      filtered.sort((a, b) => b.createdAt - a.createdAt);
      setPoems(filtered);
      cachePoems(all);
    } catch {
      const all = await db.poems.filter((p) => p.isFavorite && !p.deletedAt).toArray();
      const filtered = collectionId
        ? all.filter((p) => p.collectionId === collectionId)
        : all;
      filtered.sort((a, b) => b.createdAt - a.createdAt);
      setPoems(filtered);
    }
    setLoading(false);
  }, [collectionId]);

  useEffect(() => { load(); }, [load]);
  return { poems, loading, refresh: load };
}

/**
 * 按季节获取诗词
 */
export function useSeasonPoems(season: string, collectionId?: string) {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!season) { setPoems([]); setLoading(false); return; }
    (async () => {
      try {
        const all = await getAllPoems();
        const filtered = all.filter((p) => p.season === season);
        const result = collectionId
          ? filtered.filter((p) => p.collectionId === collectionId)
          : filtered;
        result.sort((a, b) => b.createdAt - a.createdAt);
        setPoems(result);
        cachePoems(all);
      } catch {
        const all = await db.poems
          .filter((p) => p.season === season && !p.deletedAt)
          .toArray();
        const filtered = collectionId
          ? all.filter((p) => p.collectionId === collectionId)
          : all;
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        setPoems(filtered);
      }
      setLoading(false);
    })();
  }, [season, collectionId]);

  return { poems, loading };
}
