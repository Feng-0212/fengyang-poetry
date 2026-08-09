"use client";

import { useState } from "react";
import type { Poem } from "@/types/poem";
import { addPoem as addPoemApi } from "@/lib/api";
import { CLASSIC_POEMS, seasonToTerm } from "@/lib/classic-poems";

interface Props {
  poems: Poem[];
  onNotify: (type: "success" | "error" | "info", message: string) => void;
  onDone: () => void;
}

export default function ClassicImportSection({ poems, onNotify, onDone }: Props) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    failed: number;
  } | null>(null);

  // 与现有诗库查重（按标题）
  const existingTitles = new Set(
    poems.filter((p) => !p.deletedAt).map((p) => p.title)
  );
  const pending = CLASSIC_POEMS.filter((p) => !existingTitles.has(p.title));
  const duplicated = CLASSIC_POEMS.length - pending.length;

  async function handleImport() {
    if (pending.length === 0) {
      onNotify("info", "经典诗词已全部导入，无需重复");
      return;
    }
    if (
      !confirm(
        `将导入 ${pending.length} 首经典诗词（${duplicated} 首已存在将跳过）到「四时墨苑」。继续？`
      )
    ) {
      return;
    }
    setRunning(true);
    setResult(null);
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    for (const cp of pending) {
      try {
        await addPoemApi({
          collectionId: "sishi-moyuan",
          title: cp.title,
          author: cp.author,
          dynasty: cp.dynasty,
          content: cp.content,
          season: (cp.season || "spring") as Poem["season"],
          solarTerm: seasonToTerm(cp.season) as Poem["solarTerm"],
          tags: cp.tags,
          isFavorite: false,
          favoriteCount: 0,
        });
        imported++;
      } catch {
        failed++;
      }
    }
    setResult({ imported, skipped: duplicated, failed });
    if (imported > 0) {
      onNotify("success", `成功导入 ${imported} 首经典诗词`);
      onDone(); // 刷新页面数据
    } else if (failed > 0) {
      onNotify("error", `导入失败 ${failed} 首，请检查网络`);
    }
    setRunning(false);
  }

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-lg bg-ink/3">
          <div className="text-2xl font-[var(--font-mashan)] text-ink-dark">
            {CLASSIC_POEMS.length}
          </div>
          <div className="text-xs text-ink-light">经典库总数</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-gold/8">
          <div className="text-2xl font-[var(--font-mashan)] text-gold">
            {pending.length}
          </div>
          <div className="text-xs text-ink-light">待导入</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-cinnabar/8">
          <div className="text-2xl font-[var(--font-mashan)] text-cinnabar">
            {duplicated}
          </div>
          <div className="text-xs text-ink-light">已存在跳过</div>
        </div>
      </div>

      {/* 导入按钮 */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleImport}
          disabled={running || pending.length === 0}
          className="px-5 py-2.5 rounded-lg bg-cinnabar text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {running ? "导入中..." : "· 一键导入经典诗词 ·"}
        </button>
        {running && (
          <span className="text-xs text-ink-light animate-pulse">
            正在导入《静夜思》《春晓》等…请勿关闭页面
          </span>
        )}
      </div>

      {/* 说明 */}
      <p className="text-xs text-ink-light leading-relaxed">
        内置 {CLASSIC_POEMS.length} 首公版经典（唐诗宋词，覆盖四季），导入到「四时墨苑」。
        按标题查重，已存在的诗词自动跳过，不会产生重复。
      </p>

      {/* 运行结果 */}
      {result && (
        <div className="p-4 rounded-lg border border-cinnabar/20 bg-cinnabar/5">
          <p className="text-sm text-ink-dark font-medium mb-2">导入完成</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-cinnabar font-medium">{result.imported}</span>
              <span className="text-ink-light"> 首已导入</span>
            </div>
            <div>
              <span className="text-ink-light font-medium">{result.skipped}</span>
              <span className="text-ink-light"> 首已存在跳过</span>
            </div>
            <div>
              <span className="text-cinnabar/60 font-medium">{result.failed}</span>
              <span className="text-ink-light"> 首失败</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
