// ============================================================
// 四时墨苑 - 设置页面（数据导出/导入）
// ============================================================
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAllPoems } from "@/hooks/usePoem";
import { useSolarTerm } from "@/hooks/useSolarTerm";
import { importData, getAllCollections } from "@/lib/db";
import { addPoem as addPoemApi, getAllPoems } from "@/lib/api";
import { downloadFile, formatDate, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SOLAR_TERMS_META } from "@/lib/solarterms";
import { usePasswordGate } from "@/components/auth/PasswordGate";
import TagManager from "@/components/settings/TagManager";
import {
  getAiConfig,
  saveAiConfig,
  clearAiConfig,
  type AiConfig,
} from "@/lib/ai";

export default function SettingsPage() {
  const solarTerm = useSolarTerm();
  const { poems, refresh } = useAllPoems();
  const { requirePassword } = usePasswordGate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [tagMgrKey, setTagMgrKey] = useState(0);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // AI 配置
  const [aiConfig, setAiConfig] = useState<AiConfig>({
    apiKey: "",
    baseUrl: "",
    textModel: "",
    imageModel: "",
  });
  const [showKey, setShowKey] = useState(false);
  useEffect(() => {
    setAiConfig(getAiConfig());
  }, []);

  const handleSaveAi = () => {
    saveAiConfig(aiConfig);
    showNotification("success", "AI 配置已保存（仅存于本设备）");
  };
  const handleClearAi = () => {
    clearAiConfig();
    setAiConfig({ apiKey: "", baseUrl: "", textModel: "", imageModel: "" });
    showNotification("info", "已清除 AI 配置，将使用站点默认");
  };

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
      const data = await getAllPoems();
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
      const data = await getAllPoems();
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

      // 走 API 导入（云端持久化）
      const cols = await getAllCollections();
      const colBySlug: Record<string, string> = {};
      cols.forEach((c) => (colBySlug[c.slug] = c.id));
      let count = 0;
      for (const p of poemsToImport) {
        let cid = p.collectionId;
        if (colBySlug[cid]) cid = colBySlug[cid];
        if (!cid && cols.length > 0) cid = cols[0].id;
        if (!cid) continue;
        await addPoemApi({
          collectionId: cid,
          title: p.title || "无题",
          content: p.content || "",
          season: p.season || "spring",
          solarTerm: p.solarTerm || "lichun",
          annotation: p.annotation,
          author: p.author || "佚名",
          dynasty: p.dynasty || "佚名",
          isFavorite: !!p.isFavorite,
          favoriteCount: p.isFavorite ? 1 : 0,
        });
        count++;
      }
      await refresh();
      showNotification("success", `已导入 ${count} 首诗词到云端`);
    } catch (e) {
      showNotification("error", "导入失败，文件格式可能不正确");
      console.error(e);
    } finally {
      setImporting(false);
      // 重置 input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 导入示例数据
  const handleSeed = async () => {
    await requirePassword(async () => {
      setSeeding(true);
      try {
        const cols = await getAllCollections();
        const bySlug: Record<string, string> = {};
        cols.forEach((c) => (bySlug[c.slug] = c.id));

        const seeds = [
          { slug: "sishi-moyuan", title: "小暑·竹下", author: "佚名", dynasty: "佚名", content: "竹影摇风过小窗，蝉声带暑入茶汤。\n闲来不卷书三页，且让清凉一寸长。", season: "summer", solarTerm: "xiaoshu" },
          { slug: "sishi-moyuan", title: "春分·一树梨云", author: "佚名", dynasty: "佚名", content: "半城风暖半城云，一树梨花开不分。\n燕子衔香过江去，误人深处是烟村。", season: "spring", solarTerm: "chunfen" },
          { slug: "yuexia-shanhe", title: "月下独酌", author: "李白", dynasty: "唐", content: "举杯邀月月先行，三影随人到处醒。\n不是独酌无伴侣，清风绕过八千峰。", season: "autumn", solarTerm: "qiufen" },
          { slug: "guanshan-ci", title: "关山词", author: "佚名", dynasty: "佚名", content: "关山月色一千重，羌笛声中万马慵。\n何日将军归未晚，梅花照入满头篷。", season: "winter", solarTerm: "daxue" },
          { slug: "yanyu-ge", title: "雨霖铃·烟雨", author: "柳永", dynasty: "宋", content: "烟雨江南三月天，粉墙黑瓦水如年。\n一袭纸伞缓缓过，石板街上有流年。", season: "spring", solarTerm: "yushui" },
          { slug: "tongxin-zhai", title: "咏鹅", author: "骆宾王", dynasty: "唐", content: "鹅鹅鹅，曲项向天歌。\n白毛浮绿水，红掌拨清波。", season: "summer", solarTerm: "xiaoshu" },
          { slug: "xinshi-lin", title: "一棵开花的树", author: "席慕蓉", dynasty: "现代", content: "如何让你遇见我\n在我最美丽的时刻\n为这\n我已在佛前求了五百年\n求佛让我们结一段尘缘", season: "spring", solarTerm: "qingming" },
        ];

        let count = 0;
        for (const s of seeds) {
          const cid = bySlug[s.slug];
          if (!cid) continue;
          await addPoemApi({
            collectionId: cid,
            title: s.title,
            content: s.content,
            season: s.season as any,
            solarTerm: s.solarTerm as any,
            author: s.author,
            dynasty: s.dynasty,
            isFavorite: false,
            favoriteCount: 0,
          });
          count++;
        }
        await refresh();
        showNotification("success", `已添加 ${count} 首示例诗词到云端`);
      } catch (e) {
        showNotification("error", "示例数据添加失败");
        console.error(e);
      } finally {
        setSeeding(false);
      }
    });
  };

  return (
    <div className="paper-texture min-h-screen">
      <Navbar />

      <main className="page-container max-w-3xl mx-auto px-6 py-12">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="font-[var(--font-mashan)] text-4xl text-ink-dark mb-2">
            墨韵阁
          </h1>
          <p className="text-ink-light text-sm">
            数据有归，墨迹长存
          </p>
        </div>

        {/* AI 设置 */}
        <section className="mb-8 p-6 rounded-xl bg-white/60 border border-ink/8">
          <h2 className="font-[var(--font-mashan)] text-lg text-ink-dark mb-2">
            AI 设置
          </h2>
          <p className="text-sm text-ink-light mb-4 leading-relaxed">
            用于「AI 赏析」与「AI 配图」。留空则使用站点默认配置；
            也可填入自己的 API（兼容 OpenAI 接口，如 OpenAI / DeepSeek / 通义千问等）。
            <span className="text-cinnabar/80">配置仅保存在你本地浏览器，不会上传。</span>
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-ink-light mb-1">API Key</label>
              <div className="flex gap-2">
                <input
                  type={showKey ? "text" : "password"}
                  value={aiConfig.apiKey}
                  onChange={(e) =>
                    setAiConfig({ ...aiConfig, apiKey: e.target.value })
                  }
                  placeholder="sk-...（留空使用站点默认）"
                  className="flex-1 px-3 py-2 rounded-lg border border-ink/15 bg-white/70 text-sm text-ink focus:border-cinnabar/50 focus:outline-none"
                />
                <button
                  onClick={() => setShowKey((v) => !v)}
                  className="px-3 py-2 rounded-lg border border-ink/10 text-xs text-ink-light hover:bg-ink/5"
                >
                  {showKey ? "隐藏" : "显示"}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-ink-light mb-1">
                Base URL（选填，默认 https://api.openai.com/v1）
              </label>
              <input
                type="text"
                value={aiConfig.baseUrl}
                onChange={(e) =>
                  setAiConfig({ ...aiConfig, baseUrl: e.target.value })
                }
                placeholder="https://api.openai.com/v1"
                className="w-full px-3 py-2 rounded-lg border border-ink/15 bg-white/70 text-sm text-ink focus:border-cinnabar/50 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ink-light mb-1">
                  文本模型（赏析）
                </label>
                <input
                  type="text"
                  value={aiConfig.textModel}
                  onChange={(e) =>
                    setAiConfig({ ...aiConfig, textModel: e.target.value })
                  }
                  placeholder="gpt-4o-mini"
                  className="w-full px-3 py-2 rounded-lg border border-ink/15 bg-white/70 text-sm text-ink focus:border-cinnabar/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-light mb-1">
                  图像模型（配图）
                </label>
                <input
                  type="text"
                  value={aiConfig.imageModel}
                  onChange={(e) =>
                    setAiConfig({ ...aiConfig, imageModel: e.target.value })
                  }
                  placeholder="dall-e-3"
                  className="w-full px-3 py-2 rounded-lg border border-ink/15 bg-white/70 text-sm text-ink focus:border-cinnabar/50 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSaveAi}
                className="px-5 py-2 rounded-lg bg-cinnabar text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                保存
              </button>
              <button
                onClick={handleClearAi}
                className="px-5 py-2 rounded-lg border border-ink/15 text-sm text-ink-light hover:bg-ink/5 transition-colors"
              >
                清除
              </button>
            </div>
          </div>
        </section>

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
              label="藏分布"
              value={new Set(poems.map((p) => p.collectionId)).size}
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

          {/* 一键导入示例数据 */}
          <div className="mt-4 pt-4 border-t border-ink/8">
            <p className="text-xs text-ink-light/70 mb-3">清空了？一键补充示例诗词到云端：</p>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="w-full py-2.5 rounded-lg text-sm transition-all disabled:opacity-50"
              style={{ backgroundColor: "rgba(193,74,63,0.08)", color: "#C14A3F" }}
            >
              {seeding ? "添加中..." : "· 导入示例数据（7首） ·"}
            </button>
          </div>
        </section>

        {/* 标签管理 */}
        <section className="mb-8 p-6 rounded-xl bg-white/60 border border-ink/8">
          <h2 className="font-[var(--font-mashan)] text-lg text-ink-dark mb-2">
            标签管理
          </h2>
          <p className="text-sm text-ink-light mb-4">
            查看、重命名、合并或删除诗词标签（需密码）
          </p>
          <TagManager
            key={tagMgrKey}
            requirePassword={requirePassword}
            onDone={() => setTagMgrKey((k) => k + 1)}
            accentColor="#C14A3F"
          />
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
