"use client";

import { useState, useEffect } from "react";
import { getBackupHistory, downloadBackup } from "@/lib/api";
import type { BackupSnapshot } from "@/lib/api";

interface Props {
  onNotify: (type: "success" | "error" | "info", message: string) => void;
}

export default function BackupSection({ onNotify }: Props) {
  const [history, setHistory] = useState<BackupSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const data = await getBackupHistory();
      setHistory(data);
    } catch {
      onNotify("info", "暂无快照历史（请等待每日 cron 触发）");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(date: string) {
    setDownloading(date);
    try {
      const data = await downloadBackup(date);
      const json = JSON.stringify(
        {
          version: "1.0",
          type: "snapshot",
          date,
          poemCount: data.poems.length,
          poems: data.poems,
        },
        null,
        2
      );
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `四时墨苑_快照_${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onNotify("success", `已下载 ${date} 快照（${data.poems.length} 首）`);
    } catch {
      onNotify("error", "下载失败，请稍后重试");
    } finally {
      setDownloading(null);
    }
  }

  async function handleTriggerBackup() {
    setLoading(true);
    try {
      const secret = new URL(window.location.href).searchParams.get("key") || "";
      const res = await fetch(
        `/api/backup${secret ? `?key=${secret}` : ""}`
      );
      const json = await res.json();
      if (res.ok) {
        onNotify("success", `快照已保存（${json.date}，${json.poems} 首）`);
        loadHistory();
      } else {
        onNotify("error", "备份失败：" + json.error);
      }
    } catch {
      onNotify("error", "备份请求失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 手动触发备份按钮 */}
      <div className="flex gap-3">
        <button
          onClick={handleTriggerBackup}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-cinnabar text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "保存中..." : "· 保存当前快照 ·"}
        </button>
        <button
          onClick={loadHistory}
          disabled={loading}
          className="px-4 py-2 rounded-lg border border-ink/15 text-sm text-ink-light hover:bg-ink/5 transition-colors disabled:opacity-50"
        >
          刷新
        </button>
      </div>

      {/* 快照历史列表 */}
      {history.length === 0 && !loading ? (
        <p className="text-sm text-ink-light/60 italic">
          暂无快照记录。每日 UTC 19:00 自动备份一次
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-ink-light mb-2">
            最近 {history.length} 条快照（保留30天）：
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {history.map((snap) => (
              <div
                key={snap.date}
                className="flex items-center justify-between p-3 rounded-lg border border-ink/10 hover:border-cinnabar/30 hover:bg-cinnabar/3 transition-all"
              >
                <div>
                  <div className="text-sm font-medium text-ink-dark">
                    {snap.date}
                  </div>
                  <div className="text-xs text-ink-light">
                    {snap.poemCount} 首诗词
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(snap.date)}
                  disabled={downloading === snap.date}
                  className="px-3 py-1.5 rounded text-xs text-cinnabar border border-cinnabar/30 hover:bg-cinnabar/8 transition-colors disabled:opacity-40"
                >
                  {downloading === snap.date ? "下载中..." : "下载"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
