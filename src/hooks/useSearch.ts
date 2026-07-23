// ============================================================
// 搜索 Hook（支持拼音 + 语义搜索）
// ============================================================
import { useMemo, useState, useCallback } from "react";
import Fuse from "fuse.js";
import type { Poem } from "@/types/poem";
import { matchWithPinyin, pinyinMatchScore } from "@/lib/pinyin";

interface SearchResult {
  poem: Poem;
  score: number; // 匹配得分（越高越好）
  matchType: "text" | "pinyin" | "semantic";
}

/**
 * 综合搜索 Hook
 * 支持三种模式：
 * 1. 文本搜索（Fuse.js 模糊匹配）
 * 2. 拼音搜索（标题/内容的拼音）
 * 3. 语义搜索（AI 理解意图）
 */
export function useSearch(poems: Poem[]) {
  const [semanticResults, setSemanticResults] = useState<string[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);

  // Fuse 实例（文本搜索）
  const fuse = useMemo(
    () =>
      new Fuse(poems, {
        keys: [
          { name: "title", weight: 3 },
          { name: "content", weight: 2 },
          { name: "annotation", weight: 1 },
          { name: "tags", weight: 1.5 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
        includeScore: true,
      }),
    [poems]
  );

  // 文本 + 拼音搜索
  const searchByTextAndPinyin = useCallback(
    (query: string): SearchResult[] => {
      if (!query.trim()) return [];

      const results: SearchResult[] = [];
      const seen = new Set<string>();

      // 1. Fuse 文本搜索
      const fuseResults = fuse.search(query).slice(0, 50);
      fuseResults.forEach((r) => {
        if (!seen.has(r.item.id)) {
          seen.add(r.item.id);
          results.push({
            poem: r.item,
            score: (1 - (r.score || 0)) * 100, // Fuse score 越低越好
            matchType: "text",
          });
        }
      });

      // 2. 拼音搜索（补充 Fuse 未匹配的）
      poems.forEach((poem) => {
        if (seen.has(poem.id)) return;

        // 标题拼音匹配
        const titleScore = pinyinMatchScore(poem.title, query);
        if (titleScore > 0) {
          seen.add(poem.id);
          results.push({
            poem,
            score: titleScore,
            matchType: "pinyin",
          });
          return;
        }

        // 内容拼音匹配（只检查前 100 字）
        const contentScore = pinyinMatchScore(poem.content.slice(0, 100), query);
        if (contentScore > 0) {
          seen.add(poem.id);
          results.push({
            poem,
            score: contentScore * 0.5, // 内容匹配权重更低
            matchType: "pinyin",
          });
        }
      });

      // 按得分排序
      return results.sort((a, b) => b.score - a.score);
    },
    [poems, fuse]
  );

  // 语义搜索（调用 AI）
  const searchSemantic = useCallback(
    async (query: string): Promise<void> => {
      if (!query.trim()) {
        setSemanticResults([]);
        return;
      }

      setSemanticLoading(true);
      try {
        const resp = await fetch("/api/ai/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, limit: 10 }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const ids = (data.results || []).map((r: any) => r.id);
          setSemanticResults(ids);
        }
      } catch (err) {
        console.error("[Semantic search]", err);
      } finally {
        setSemanticLoading(false);
      }
    },
    []
  );

  // 清除语义搜索结果
  const clearSemantic = useCallback(() => {
    setSemanticResults([]);
    setSemanticLoading(false);
  }, []);

  // 合并文本+拼音搜索和语义搜索
  const search = useCallback(
    (query: string): SearchResult[] => {
      const textResults = searchByTextAndPinyin(query);

      // 如果有语义搜索结果，提升其权重
      if (semanticResults.length > 0) {
        const semanticSet = new Set(semanticResults);
        return textResults.map((r) => ({
          ...r,
          score: semanticSet.has(r.poem.id) ? r.score + 50 : r.score,
          matchType: semanticSet.has(r.poem.id) ? "semantic" : r.matchType,
        }));
      }

      return textResults;
    },
    [searchByTextAndPinyin, semanticResults]
  );

  return {
    search,
    searchSemantic,
    semanticLoading,
    clearSemantic,
  };
}
