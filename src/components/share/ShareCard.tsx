"use client";

// ============================================================
// 墨韵阁 - 朋友圈分享卡片（Phase 6）
// Canvas 绘制诗词竖排水墨卡片，支持下载 / 系统分享
// ============================================================
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Poem, Collection } from "@/types/poem";
import { getSolarTermMeta } from "@/lib/solarterms";
import { formatDate } from "@/lib/utils";

interface ShareCardProps {
  poem: Poem;
  collection?: Collection | null;
  open: boolean;
  onClose: () => void;
}

type CardStyle = "rice" | "ink" | "cinnabar";

const STYLE_META: Record<
  CardStyle,
  { label: string; bg: string; bg2: string; textColor: string; subColor: string }
> = {
  rice: {
    label: "宣纸",
    bg: "#F5F0E8",
    bg2: "#EDE5D6",
    textColor: "#1A1A1A",
    subColor: "#8A7A5A",
  },
  ink: {
    label: "墨夜",
    bg: "#1F1B1A",
    bg2: "#2E2825",
    textColor: "#F0EBE0",
    subColor: "#B8A98A",
  },
  cinnabar: {
    label: "朱砂",
    bg: "#7A2A22",
    bg2: "#8F352B",
    textColor: "#F8ECE0",
    subColor: "#E8C0A0",
  },
};

export default function ShareCard({ poem, collection, open, onClose }: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [style, setStyle] = useState<CardStyle>("rice");
  const [dataUrl, setDataUrl] = useState<string>("");
  const [rendering, setRendering] = useState(false);

  const meta = getSolarTermMeta(poem.solarTerm);
  const accent = collection?.color || meta?.color || "#C14A3F";
  const sealChar = collection?.seal || meta?.name?.slice(0, 1) || "诗";

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setRendering(true);

    const W = 1080;
    const H = 1440;
    const dpr = 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const s = STYLE_META[style];

    // 背景渐变
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, s.bg);
    grad.addColorStop(1, s.bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 宣纸噪点纹理（轻微）
    ctx.save();
    ctx.globalAlpha = style === "rice" ? 0.04 : 0.06;
    for (let i = 0; i < 2200; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = Math.random() * 1.4;
      ctx.fillStyle = style === "rice" ? "#000" : "#fff";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 外边框
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 3;
    ctx.strokeRect(60, 60, W - 120, H - 120);
    ctx.globalAlpha = 1;

    // 顶部藏 / 节气标签
    ctx.fillStyle = s.subColor;
    ctx.font = "500 34px 'Noto Serif SC', serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const topLabel = collection ? collection.name : (meta?.name || "");
    ctx.fillText(topLabel, 110, 110);

    // 右上印章
    const sealX = W - 110 - 96;
    const sealY = 100;
    ctx.fillStyle = accent;
    roundRect(ctx, sealX, sealY, 96, 96, 12);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "700 56px 'Ma Shan Zheng', 'Noto Serif SC', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(sealChar.slice(0, 1), sealX + 48, sealY + 52);

    // 标题（居中）
    ctx.fillStyle = s.textColor;
    ctx.font = "700 76px 'Ma Shan Zheng', 'Noto Serif SC', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(poem.title, W / 2, 300);

    // 作者·朝代
    const author = poem.author || "佚名";
    const dynasty = poem.dynasty || "";
    ctx.fillStyle = s.subColor;
    ctx.font = "400 36px 'Noto Serif SC', serif";
    ctx.fillText(
      dynasty ? `〔${dynasty}〕${author}` : author,
      W / 2,
      375
    );

    // 分隔线
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 120, 430);
    ctx.lineTo(W / 2 + 120, 430);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 正文 —— 竖排，从右到左（自适应字号 + 过长节选）
    // 1) 按标点/换行拆成短句，每句为一列
    const rawVerses = poem.content
      .split(/[，。；！？、,.!?;:\n]/g)
      .map((l) => l.trim())
      .filter(Boolean);

    // 2) 单句过长则再切分，避免一列塞不下
    const MAX_COL_CHARS = 18;
    const wrapVerse = (v: string): string[] => {
      const arr = Array.from(v);
      if (arr.length <= MAX_COL_CHARS) return [v];
      const out: string[] = [];
      for (let i = 0; i < arr.length; i += MAX_COL_CHARS) {
        out.push(arr.slice(i, i + MAX_COL_CHARS).join(""));
      }
      return out;
    };
    const allVerses = rawVerses.flatMap(wrapVerse);

    // 3) 可用绘制区域
    const availTop = 470;
    const availBottom = H - 260;
    const availH = availBottom - availTop;
    const availLeft = 130;
    const availRight = W - 130;
    const availW = availRight - availLeft;

    const MIN_FONT = 30;
    const MAX_FONT = 58;
    const CHAR_RATIO = 1.15; // 字间距 = 字号 * 比例
    const COL_RATIO = 1.62; // 列间距 = 字号 * 比例

    // 4) 计算给定句集能用的最大字号
    const fitFont = (verses: string[]): number => {
      const numCols = Math.max(verses.length, 1);
      const maxChars = Math.max(
        ...verses.map((v) => Array.from(v).length),
        1
      );
      const fByHeight = availH / (maxChars * CHAR_RATIO);
      const fByWidth = availW / (numCols * COL_RATIO);
      return Math.min(fByHeight, fByWidth, MAX_FONT);
    };

    // 5) 若字号过小则逐列节选，直到达到可读字号
    let verses = allVerses;
    let truncated = false;
    let fontSize = fitFont(verses);
    while (fontSize < MIN_FONT && verses.length > 2) {
      verses = verses.slice(0, verses.length - 1);
      truncated = true;
      fontSize = fitFont(verses);
    }
    fontSize = Math.max(fontSize, MIN_FONT);

    const charGap = fontSize * CHAR_RATIO;
    const lineGap = fontSize * COL_RATIO;

    ctx.font = `500 ${fontSize}px 'Noto Serif SC', 'STKaiti', serif`;
    ctx.fillStyle = s.textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const numCols = verses.length;
    const colsWidth = numCols * lineGap;
    let colX = W / 2 + colsWidth / 2 - lineGap / 2;

    for (const verse of verses) {
      const chars = Array.from(verse);
      const lineH = chars.length * charGap;
      let y = availTop + Math.max(0, (availH - lineH) / 2);
      for (const ch of chars) {
        ctx.fillText(ch, colX, y);
        y += charGap;
      }
      colX -= lineGap;
    }

    // 6) 节选标记
    if (truncated) {
      ctx.fillStyle = s.subColor;
      ctx.font = "400 26px 'Noto Serif SC', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("—— 节选 ——", W / 2, availBottom + 4);
    }

    // 底部信息
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = s.subColor;
    ctx.font = "400 30px 'Noto Serif SC', serif";
    ctx.fillText(formatDate(poem.createdAt), W / 2, H - 210);

    // 底部品牌
    ctx.fillStyle = accent;
    ctx.font = "700 40px 'Ma Shan Zheng', 'Noto Serif SC', serif";
    ctx.fillText("墨 韵 阁", W / 2, H - 150);
    ctx.fillStyle = s.subColor;
    ctx.font = "400 24px 'Noto Serif SC', serif";
    ctx.fillText("四时有墨 · 苑藏诗意", W / 2, H - 108);

    // 生成 dataURL
    try {
      const url = canvas.toDataURL("image/png");
      setDataUrl(url);
    } catch {
      setDataUrl("");
    }
    setRendering(false);
  }, [poem, collection, style, accent, sealChar, meta]);

  // 等字体加载后再绘制
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const run = async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready;
      } catch {
        /* ignore */
      }
      if (!cancelled) draw();
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [open, draw]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `墨韵阁-${poem.title}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (!dataUrl) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `墨韵阁-${poem.title}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: poem.title,
          text: `${poem.title} — 墨韵阁`,
        });
      } else {
        handleDownload();
      }
    } catch {
      /* 用户取消或不支持 */
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative bg-rice rounded-2xl shadow-ink-heavy max-w-md w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink/8">
              <h3 className="font-[var(--font-mashan)] text-lg text-ink-dark">
                分享卡片
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-light hover:bg-ink/5"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>

            {/* 预览 */}
            <div className="p-5">
              <div className="relative rounded-lg overflow-hidden shadow-ink bg-white/50">
                {dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={dataUrl}
                    alt={poem.title}
                    className="w-full block"
                  />
                ) : (
                  <div className="aspect-[3/4] flex items-center justify-center text-ink-light text-sm">
                    {rendering ? "正在生成…" : "准备中…"}
                  </div>
                )}
              </div>

              {/* 隐藏画布 */}
              <canvas ref={canvasRef} className="hidden" />

              {/* 样式选择 */}
              <div className="flex items-center gap-2 mt-4">
                {(Object.keys(STYLE_META) as CardStyle[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setStyle(k)}
                    className={`flex-1 py-2 rounded-lg text-sm transition-all border ${
                      style === k
                        ? "border-cinnabar text-cinnabar bg-cinnabar/5 font-medium"
                        : "border-ink/10 text-ink-light hover:bg-ink/5"
                    }`}
                  >
                    {STYLE_META[k].label}
                  </button>
                ))}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={handleShare}
                  disabled={!dataUrl}
                  className="flex-1 py-3 rounded-lg bg-cinnabar text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  分享
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!dataUrl}
                  className="flex-1 py-3 rounded-lg border border-ink/15 text-ink text-sm font-medium hover:bg-ink/5 transition-colors disabled:opacity-40"
                >
                  保存图片
                </button>
              </div>
              <p className="text-center text-xs text-ink-light/60 mt-3">
                长按图片或点击保存，即可分享到朋友圈
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 圆角矩形辅助
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
