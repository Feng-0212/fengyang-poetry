// ============================================================
// 四时墨苑 - 设置页面（数据导出/导入）
// ============================================================
"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { usePoems } from "@/hooks/usePoem";
import { useSolarTerm } from "@/hooks/useSolarTerm";
import { exportAllData, importData } from "@/lib/db";
import { downloadFile, formatDate, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SOLAR_TERMS_META } from "@/lib/solarterms";

export default function SettingsPage() {
  const solarTerm = useSolarTerm();
  const { poems, refresh } = usePoems();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // 显示通知
  const showNotification = (
    type: "success" | "error" | "info",
    message: string
  ) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // 导出为 JSON
  const handleExportJSON = async () => {
    if (poems.length === 0) {
      showNotification("info", "还没有诗词可导出");
      return;
    }
    setExporting(true);
    try {
      const data = await exportAllData();
      const exportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        totalCount: data.length,
        poems: data,
      };
      const json = JSON.stringify(exportData, null, 2);
      const filename = `四时墨苑_诗词备份_${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      downloadFile(json, filename, "application/json");
      showNotification("success", `已导出 ${data.length} 首诗词`);
    } catch (e) {
      showNotification("error", "导出失败");
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  // 导出为 TXT（人类可读）
  const handleExportTXT = async () => {
    if (poems.length === 0) {
      showNotification("info", "还没有诗词可导出");
      return;
    }
    setExporting(true);
    try {
      const data = await exportAllData();
      let txt = `四时墨苑 · 诗词合集\n`;
      txt += `导出时间：${new Date().toLocaleString("zh-CN")}\n`;
      txt += `诗词数量：${data.length} 首\n`;
      txt += `\n${"═".repeat(40)}\n\n`;

      data.forEach((poem, i) => {
        const meta = SOLAR_TERMS_META.find((m) => m.key === poem.solarTerm);
        txt += `【${i + 1}】${poem.title}\n`;
        txt += `节气：${meta?.name || ""}    日期：${formatDate(poem.createdAt)}\n\n`;
        txt += `${poem.content}\n`;
        if (poem.annotation) {
          txt += `\n[随笔] ${poem.annotation}\n`;
        }
        txt += `\n${"─".repeat(40)}\n\n`;
      });

      const filename = `四时墨苑_诗词合集_${new Date()
        .toISOString()
        .slice(0, 10)}.txt`;
      downloadFile(txt, filename, "text/plain;charset=utf-8");
      showNotification("success", `已导出 ${data.length} 首诗词为 TXT`);
    } catch (e) {
      showNotification("error", "导出失败");
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  // 触发文件选择
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // 导入数据
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // 兼容不同格式
      let poemsToImport;
      if (data.poems && Array.isArray(data.poems)) {
        poemsToImport = data.poems;
      } else if (Array.isArray(data)) {
        poemsToImport = data;
      } else {
        throw new Error("文件格式不正确");
      }

      await importData(poemsToImport);
      await refresh();
      showNotification("success", `已导入 ${poemsToImport.length} 首诗词`);
    } catch (e) {
      showNotification("error", "导入失败，文件格式可能不正确");
      console.error(e);
    } finally {
      setImporting(false);
      // 重置 input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="paper-texture min-h-screen">
      <Navbar />

      <main className="page-container max-w-3xl mx-auto px-6 py-12">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="font-[var(--font-mashan)] text-4xl text-ink-dark mb-2">
            墨苑管理
          </h1>
          <p className="text-ink-light text-sm">
            数据有归，墨迹长存
          </p>
        </div>

        {/* 数据概览 */}
        <section className="mb-8 p-6 rounded-xl bg-white/60 border border-ink/8">
          <h2 className="font-[var(--font-mashan)] text-lg text-ink-dark mb-4">
            数据概览
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <StatBox label="诗词总数" value={poems.length} unit="首" />
            <StatBox
              label="累计字数"
              value={poems.reduce((sum, p) => sum + p.content.length, 0)}
              unit="字"
            />
            <StatBox
              label="节气分布"
              value={new Set(poems.map((p) => p.solarTerm)).size}
              unit="个"
            />
          </div>
        </section>

        {/* 数据导出 */}
        <section className="mb-8 p-6 rounded-xl bg-white/60 border border-ink/8">
          <h2 className="font-[var(--font-mashan)] text-lg text-ink-dark mb-2">
            数据导出
          </h2>
          <p className="text-sm text-ink-light mb-4">
            建议定期导出备份，避免清除浏览器数据后丢失
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleExportJSON}
              disabled={exporting}
              className="p-4 rounded-lg border border-ink/10 hover:border-cinnabar/40 hover:bg-cinnabar/5 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded bg-cinnabar/10 flex items-center justify-center text-cinnabar">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-ink-dark group-hover:text-cinnabar">
                    导出 JSON
                  </div>
                  <div className="text-xs text-ink-light">完整数据，可恢复</div>
                </div>
              </div>
            </button>

            <button
              onClick={handleExportTXT}
              disabled={exporting}
              className="p-4 rounded-lg border border-ink/10 hover:border-cinnabar/40 hover:bg-cinnabar/5 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded bg-gold/10 flex items-center justify-center text-gold">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-ink-dark group-hover:text-cinnabar">
                    导出 TXT
                  </div>
                  <div className="text-xs text-ink-light">可读格式，分享用</div>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* 数据导入 */}
        <section className="mb-8 p-6 rounded-xl bg-white/60 border border-ink/8">
          <h2 className="font-[var(--font-mashan)] text-lg text-ink-dark mb-2">
            数据导入
          </h2>
          <p className="text-sm text-ink-light mb-4">
            从之前导出的 JSON 备份文件恢复诗词
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="hidden"
          />

          <button
            onClick={handleImportClick}
            disabled={importing}
            className="w-full p-4 rounded-lg border-2 border-dashed border-ink/15 hover:border-cinnabar/40 hover:bg-cinnabar/5 transition-all"
          >
            <div className="flex flex-col items-center gap-2">
              <svg
                className="w-8 h-8 text-ink-light"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-sm text-ink-light">
                {importing ? "导入中..." : "点击选择 JSON 文件"}
              </span>
            </div>
          </button>
        </section>

        {/* 其他管理 */}
        <section className="p-6 rounded-xl bg-white/60 border border-ink/8">
          <h2 className="font-[var(--font-mashan)] text-lg text-ink-dark mb-4">
            数据管理
          </h2>
          <div className="space-y-2">
            <Link
              href="/trash"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-ink/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-ink-light"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span className="text-sm text-ink-dark">回收站</span>
              </div>
              <svg
                className="w-4 h-4 text-ink-light"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>

            <Link
              href="/write"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-ink/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-ink-light"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                <span className="text-sm text-ink-dark">写一首新诗</span>
              </div>
              <svg
                className="w-4 h-4 text-ink-light"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </section>

        {/* 提示 */}
        <div className="mt-8 p-4 rounded-lg bg-rice border border-ink/8 text-xs text-ink-light leading-relaxed">
          <p className="font-medium text-ink mb-1">数据存储说明</p>
          <p>
            所有诗词数据存储于云端共享数据库（Upstash Redis），
            所有访客看到的都是同一份诗词。
            <br />
            本地浏览器会缓存一份以便离线浏览，清除浏览器数据不影响云端内容。
            建议定期导出备份。
          </p>
        </div>
      </main>

      {/* 通知 */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-lg shadow-lg z-50",
              notification.type === "success"
                ? "bg-green-500 text-white"
                : notification.type === "error"
                ? "bg-red-500 text-white"
                : "bg-ink-dark text-white"
            )}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

function StatBox({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div>
      <div className="font-[var(--font-mashan)] text-2xl text-ink-dark">
        {value}
        <span className="text-sm text-ink-light ml-1">{unit}</span>
      </div>
      <div className="text-xs text-ink-light mt-1">{label}</div>
    </div>
  );
}
