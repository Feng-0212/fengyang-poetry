// ============================================================
// 墨韵阁 - 看图赋诗面板
// 上传图片 → 视觉模型读取画面 → 生成一首诗回填编辑器
// 客户端先把图片等比压缩到最长边 1024px（JPEG q0.85），控制上传体积
// ============================================================
"use client";

import { useRef, useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  accentColor: string;
  onApply: (title: string, content: string) => void;
}

/** 等比压缩图片并转 dataURL；失败时原样返回 */
async function compressImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("读取图片失败"));
    r.readAsDataURL(file);
  });
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error("图片解析失败"));
      im.src = dataUrl;
    });
    const MAX = 1024;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    if (scale >= 1 && dataUrl.length < 1_500_000) return dataUrl;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return dataUrl;
  }
}

export default function ImagePoemPanel({ accentColor, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState("");
  const [style, setStyle] = useState<"classical" | "modern">("classical");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setError("");
    try {
      setPreview(await compressImage(f));
    } catch (e) {
      setError(e instanceof Error ? e.message : "图片处理失败");
    }
  };

  const generate = async () => {
    if (!preview || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai/poem-from-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview, style }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "生成失败，请重试");
        return;
      }
      onApply(String(data.title || "无题"), String(data.content || ""));
      setOpen(false);
      setPreview("");
    } catch {
      setError("网络错误，请重试");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-all",
          open
            ? "border-cinnabar/40 text-cinnabar bg-cinnabar/5"
            : "border-ink/10 text-ink-light hover:border-ink/20"
        )}
      >
        🖼️ 看图赋诗
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="mt-4 rounded-xl p-5"
              style={{
                background: "var(--card-bg, rgba(255,255,255,0.6))",
                border: `1px solid ${accentColor}25`,
              }}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* 图片选择/预览 */}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full sm:w-40 h-32 flex-shrink-0 rounded-lg border border-dashed border-ink/20 flex items-center justify-center overflow-hidden hover:border-cinnabar/40 transition-colors"
                  style={{ fontFamily: "var(--font-lxgw)" }}
                >
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="待赋诗的图片" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-ink-light/60">点击选择图片<br />(PNG / JPG)</span>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => pick(e.target.files?.[0])}
                />

                <div className="flex-1">
                  <div className="flex gap-2 mb-3">
                    {(
                      [
                        ["classical", "古典诗"],
                        ["modern", "现代诗"],
                      ] as const
                    ).map(([k, label]) => (
                      <button
                        key={k}
                        onClick={() => setStyle(k)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs border transition-all",
                          style === k
                            ? "text-white border-transparent"
                            : "text-ink-light border-ink/10 hover:border-ink/20"
                        )}
                        style={style === k ? { backgroundColor: accentColor } : undefined}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={generate}
                    disabled={!preview || busy}
                    className={cn(
                      "px-5 py-2 rounded-lg text-sm text-white transition-all",
                      !preview || busy ? "opacity-40 cursor-not-allowed" : "hover:opacity-90"
                    )}
                    style={{ backgroundColor: accentColor }}
                  >
                    {busy ? "观图中…" : "据此赋诗"}
                  </button>
                  <p className="text-xs text-ink-light/50 mt-2">
                    生成后自动填入标题与正文，可继续修改再收录。
                  </p>
                </div>
              </div>

              {error && <p className="text-sm text-red-500 mt-3 mb-0">{error}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
