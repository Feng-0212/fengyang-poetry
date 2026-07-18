// ============================================================
// 四时墨苑 - usePoem Hook（支持藏筛选）
// ============================================================
"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db";
import type { Poem } from "@/types/poem";

/**
 * 获取单个诗词
 */
export function usePoem(id: string) {
  const [poem, setPoem] = useState<Poem | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const found = await db.poems.get(id);
    setPoem(found || null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { poem, loading, refresh: load };
}

/**
 * 获取诗词列表（可按藏筛选）
 */
export function usePoems(collectionId?: string) {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = db.poems.toCollection();
    const all = await query.toArray();
    // 过滤未删除
    const active = all.filter((p) => !p.deletedAt);
    // 按藏筛选
    const filtered = collectionId
      ? active.filter((p) => p.collectionId === collectionId)
      : active;
    // 排序
    filtered.sort((a, b) => b.createdAt - a.createdAt);
    setPoems(filtered);
    setLoading(false);
  }, [collectionId]);

  useEffect(() => {
    load();
  }, [load]);

  return { poems, loading, refresh: load };
}

/**
 * 获取收藏诗词
 */
export function useFavoritePoems(collectionId?: string) {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    const all = await db.poems.filter((p) => p.isFavorite && !p.deletedAt).toArray();
    const filtered = collectionId
      ? all.filter((p) => p.collectionId === collectionId)
      : all;
    filtered.sort((a, b) => b.createdAt - a.createdAt);
    setPoems(filtered);
    setLoading(false);
  }, [collectionId]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return { poems, loading, refresh: loadFavorites };
}

/**
 * 按季节获取诗词
 */
export function useSeasonPoems(season: string, collectionId?: string) {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!season) {
      setPoems([]);
      setLoading(false);
      return;
    }
    db.poems
      .filter((p) => p.season === season && !p.deletedAt)
      .toArray()
      .then((all) => {
        const filtered = collectionId
          ? all.filter((p) => p.collectionId === collectionId)
          : all;
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        setPoems(filtered);
        setLoading(false);
      });
  }, [season, collectionId]);

  return { poems, loading };
}
