"use client";

import { useState } from "react";
import type { Poem } from "@/types/poem";
import { runBatchAiTags } from "@/lib/api";

interface Props {
  poems: Poem[];
  onNotify: (type: "success" | "error" | "info", message: string) => void;
  onDone: () => void;
}

export default function BatchTagSection({ poems, onNotify, onDone }: Props) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    tagged: number;
    skipped: number;
    failed: number;
  } | null>(null);

  // 统计
  const total = poems.filter((p) => !p.deletedAt).length;
  const taggedCount = poems.filter(
    (p) => !p.deletedAt && p.tags && p.tags.length > 0
  ).length;
  const untaggedCount = total - taggedCount;

  async function handleRun() {
    if (untaggedCount === 0) {
      onNotify("info", "所有诗词已有标签，无需重复生成");
      return;
    }
    if (!confirm(`将为 ${untaggedCount} 首暂无标签的诗词生成 AI 标签，已有标签的诗会跳过。继续？`)) {
      return;
    }
    setRunning(true);
    setResult(null);
    try {
      const res = await runBatchAiTags();
      setResult(res);
      if (res.tagged > 0) {
        onNotify("success", `成功为 ${res.tagged} 首诗词生成标签`);
        onDone(); // 刷新页面数据
      } else if (res.skipped > 0) {
        onNotify("info", `全部 ${res.skipped} 首诗词已有标签`);
      } else {
        onNotify("error", `生成失败（${res.failed} 首出错）`);
      }
    } catch (e) {
      onNotify("error", "批量打标签失败，请检查 AI 配置");
      console.error(e);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-lg bg-ink/3">
          <div className="text-2xl font-[var(--font-mashan)] text-ink-dark">{total}</div>
          <div className="text-xs text-ink-light">诗词总数</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-cinnabar/8">
          <div className="text-2xl font-[var(--font-mashan)] text-cinnabar">{taggedCount}</div>
          <div className="text-xs text-ink-light">已有标签</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-gold/8">
          <div className="text-2xl font-[var(--font-mashan)] text-gold">
            {untaggedCount}
          </div>
          <div className="text-xs text-ink-light">待打标签</div>
        </div>
      </div>

      {/* 运行按钮 */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={running || untaggedCount === 0}
          className="px-5 py-2.5 rounded-lg bg-cinnabar text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {running ? "生成中..." : "· 开始 AI 批量打标签 ·"}
        </button>
        {running && (
          <span className="text-xs text-ink-light animate-pulse">
            正在处理，请勿关闭页面…
          </span>
        )}
      </div>

      {/* 运行结果 */}
      {result && (
        <div className="p-4 rounded-lg border border-cinnabar/20 bg-cinnabar/5">
          <p className="text-sm text-ink-dark font-medium mb-2">处理完成</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-cinnabar font-medium">{result.tagged}</span>
              <span className="text-ink-light"> 首已生成标签</span>
            </div>
            <div>
              <span className="text-ink-light font-medium">{result.skipped}</span>
              <span className="text-ink-light"> 首已有标签跳过</span>
            </div>
            <div>
              <span className="text-cinnabar/60 font-medium">{result.failed}</span>
              <span className="text-ink-light"> 首失败</span>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-ink-light/60">
        AI 标签从预定义标签池（24个）中选取最贴切的 2-3 个，不会覆盖已有的手动标签
      </p>
    </div>
  );
}
