// ============================================================
// 四时墨苑 - useCollection Hook
// ============================================================
"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllCollections, getCollectionBySlug } from "@/lib/db";
import type { Collection } from "@/types/poem";

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await getAllCollections();
    // 按系统预设排前面
    all.sort((a, b) => {
      if (a.isSystem && !b.isSystem) return -1;
      if (!a.isSystem && b.isSystem) return 1;
      return a.createdAt - b.createdAt;
    });
    setCollections(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { collections, loading, refresh: load };
}

export function useCollection(slug: string) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setCollection(null);
      setLoading(false);
      return;
    }
    getCollectionBySlug(slug).then((c) => {
      setCollection(c || null);
      setLoading(false);
    });
  }, [slug]);

  return { collection, loading };
}
