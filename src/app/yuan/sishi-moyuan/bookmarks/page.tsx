// ============================================================
// 四时墨苑 - 书签页（/yuan/sishi-moyuan/bookmarks）
// ============================================================
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { usePoems } from "@/hooks/usePoem";
import { getSolarTermMeta } from "@/lib/solarterms";
import { cn } from "@/lib/utils";
import { WALLPAPER_SIZES } from "@/types/poem";
import { COLLECTION_IDS } from "@/types/poem";
import { getCollectionBySlug } from "@/lib/db";
import type { WallpaperOptions, Poem } from "@/types/poem";

const WALLPAPER_STYLES = [
  { key: "ink", label: "水墨留白", desc: "素雅水墨意境", preview: "rgba(26,26,26,0.06)" },
  { key: "seal", label: "朱砂印章", desc: "热烈红金配色", preview: "rgba(193,74,63,0.1)" },
  { key: "elegant", label: "四色典雅", desc: "沉稳古朴气质", preview: "rgba(184,134,11,0.08)" },
] as const;

const SIZE_OPTIONS = [
  { key: "mobile", label: "手机", ratio: "9:19.5" },
  { key: "tablet", label: "平板", ratio: "3:4" },
  { key: "desktop", label: "电脑", ratio: "16:9" },
] as const;

export default function BookmarksPage() {
  const [colId, setColId] = useState<string | undefined>(undefined);
  useEffect(() => {
    getCollectionBySlug(COLLECTION_IDS.SISHI_MOYUAN).then((c) => {
      if (c) setColId(c.id);
    });
  }, []);
  const { poems } = usePoems(colId ?? "");
  const [selectedPoem, setSelectedPoem] = useState<Poem | null>(null);
  const [size, setSize] = useState<WallpaperOptions["size"]>("mobile");
  const [style, setStyle] = useState<WallpaperOptions["style"]>("ink");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const generateWallpaper = async () => {
    if (!selectedPoem) return;
    setGenerating(true);
    try {
      const { width, height } = WALLPAPER_SIZES[size];
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      const meta = getSolarTermMeta(selectedPoem.solarTerm);

      if (style === "ink") {
        const grad = ctx.createRadialGradient(width*0.3, height*0.3, 0, width*0.5, height*0.5, Math.max(width,height));
        grad.addColorStop(0, "#F5F0E8"); grad.addColorStop(1, "#E8E0D0");
        ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
      } else if (style === "seal") {
        ctx.fillStyle = "#FDF8F5"; ctx.fillRect(0, 0, width, height);
        const grad = ctx.createRadialGradient(width*0.7, height*0.8, 0, width*0.5, height*0.5, Math.max(width,height));
        grad.addColorStop(0, "rgba(193,74,63,0.15)"); grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = "#F0EBE0"; ctx.fillRect(0, 0, width, height);
      }

      const fontSize = Math.min(width, height) * 0.045;
      ctx.fillStyle = "#1A1A1A"; ctx.font = `${fontSize}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `bold ${fontSize * 1.4}px serif`;
      ctx.fillText(selectedPoem.title, width/2, height * 0.2);
      const lines = selectedPoem.content.split(/[，。；！？\n]/).filter(Boolean);
      const lineHeight = fontSize * 2.2;
      lines.forEach((line, i) => { ctx.font = `${fontSize}px serif`; ctx.fillText(line, width/2, height*0.35 + i * lineHeight); });
      const sealSize = fontSize * 3;
      ctx.fillStyle = meta?.color || "#C14A3F";
      ctx.fillRect(width - sealSize - width*0.05, height - sealSize - height*0.05, sealSize, sealSize);
      ctx.fillStyle = "white"; ctx.font = `bold ${fontSize}px serif`;
      ctx.fillText(meta?.name?.slice(0,1)||"诗", width - sealSize/2 - width*0.05, height - sealSize/2 - height*0.05);
      setPreview(canvas.toDataURL("image/png"));
    } catch(e) { console.error("生成失败:", e); }
    finally { setGenerating(false); }
  };

  const downloadWallpaper = () => {
    if (!preview) return;
    const a = document.createElement("a");
    a.href = preview; a.download = `${selectedPoem?.title||"诗词壁纸"}.png`; a.click();
  };

  return (
    <div className="paper-texture min-h-screen">
      <Navbar />
      <main className="page-container max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/yuan/sishi-moyuan" className="inline-flex items-center gap-2 text-sm text-ink-light hover:text-ink transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
            四时墨苑
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="font-[var(--font-mashan)] text-4xl text-ink-dark mb-2">四时书签</h1>
          <p className="text-ink-light text-sm">将诗词化为可下载的书法壁纸</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-sm font-medium text-ink-dark mb-4 tracking-wider uppercase">选择诗词</h2>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
              {poems.length === 0 ? (
                <div className="text-center py-12 text-ink-light text-sm">还没有诗词，先去写一首吧</div>
              ) : poems.map((poem) => {
                const meta = getSolarTermMeta(poem.solarTerm);
                return (
                  <button key={poem.id} onClick={() => { setSelectedPoem(poem); setPreview(null); }}
                    className={cn("w-full text-left p-4 rounded-lg border transition-all", selectedPoem?.id === poem.id ? "border-cinnabar/40 bg-cinnabar/5" : "border-ink/8 bg-white/50 hover:bg-white/80")}>
                    <div className="flex items-center gap-3">
                      <div className="seal-stamp text-xs flex-shrink-0" style={{ backgroundColor: meta?.color||"#C14A3F" }}>{meta?.name?.slice(0,1)||"诗"}</div>
                      <div className="min-w-0">
                        <div className="font-[var(--font-mashan)] text-ink-dark truncate">{poem.title}</div>
                        <div className="text-xs text-ink-light truncate">{poem.content.slice(0,30)}...</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-ink-dark mb-4 tracking-wider uppercase">壁纸配置</h2>
            <div className="mb-6">
              <label className="text-xs text-ink-light mb-2 block">尺寸</label>
              <div className="flex gap-2">
                {SIZE_OPTIONS.map((opt) => (
                  <button key={opt.key} onClick={() => setSize(opt.key)}
                    className={cn("flex-1 py-2 rounded-lg text-xs border transition-all", size === opt.key ? "border-cinnabar/40 bg-cinnabar/5 text-cinnabar" : "border-ink/10 text-ink-light hover:border-ink/20")}>
                    {opt.label}<div className="text-[10px] opacity-60">{opt.ratio}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-8">
              <label className="text-xs text-ink-light mb-2 block">风格</label>
              <div className="grid grid-cols-3 gap-2">
                {WALLPAPER_STYLES.map((s) => (
                  <button key={s.key} onClick={() => setStyle(s.key)}
                    className={cn("p-3 rounded-lg border text-center transition-all", style === s.key ? "border-cinnabar/40 bg-cinnabar/5" : "border-ink/10 hover:border-ink/20")}>
                    <div className="w-6 h-6 rounded-full mx-auto mb-1" style={{ backgroundColor: s.preview, border: "1px solid rgba(0,0,0,0.1)" }} />
                    <div className="text-xs text-ink-dark font-medium">{s.label}</div>
                    <div className="text-[10px] text-ink-light">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="text-xs text-ink-light mb-2 block">预览</label>
              <div className="relative rounded-lg overflow-hidden border border-ink/10 bg-white/50 aspect-[9/19.5] flex items-center justify-center">
                {preview ? <img src={preview} alt="壁纸预览" className="w-full h-full object-cover" /> :
                  selectedPoem ? <div className="text-center text-ink-light/50 text-sm"><div className="text-4xl mb-2">📜</div>点击下方按钮生成预览</div> :
                    <div className="text-center text-ink-light/40 text-sm"><div className="text-4xl mb-2">⏳</div>先选择一首诗词</div>}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={generateWallpaper} disabled={!selectedPoem || generating}
                className={cn("flex-1 py-3 rounded-lg text-sm font-medium transition-all", !selectedPoem || generating ? "bg-ink/20 text-white/60 cursor-not-allowed" : "text-white hover:opacity-90")}
                style={{ backgroundColor: selectedPoem && !generating ? "#C14A3F" : undefined }}>
                {generating ? "生成中..." : "生成壁纸"}
              </button>
              {preview && <button onClick={downloadWallpaper} className="flex-1 py-3 rounded-lg text-sm font-medium border border-ink/20 text-ink-dark hover:bg-ink/5 transition-all">下载 PNG</button>}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
