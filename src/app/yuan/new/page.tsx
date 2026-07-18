// ============================================================
// 四时墨苑 - 创建新藏（/yuan/new）
// ============================================================
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { addCollection } from "@/lib/db";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const PRESET_COLORS = [
  { color: "#C14A3F", name: "朱砂" },
  { color: "#2C5F5F", name: "青绿" },
  { color: "#8B3A3A", name: "赭石" },
  { color: "#5B7B9A", name: "靛蓝" },
  { color: "#6B8E7B", name: "松绿" },
  { color: "#8B6914", name: "土黄" },
  { color: "#7A4E6B", name: "紫藤" },
  { color: "#4A6B8A", name: "玄青" },
];

const PRESET_GLYPHS = ["🏔️", "🌙", "⚔️", "🌧️", "🪁", "🌲", "🌺", "🍁", "❄️", "🌊", "🔥", "🌾"];

const LAYOUT_OPTIONS = [
  { key: "classic", label: "经典", desc: "卷轴式展示，适合诗词" },
  { key: "list", label: "列表", desc: "卡片列表，适合浏览" },
  { key: "gallery", label: "画廊", desc: "大图展示，适合收藏" },
] as const;

export default function NewCollectionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [subname, setSubname] = useState("");
  const [blurb, setBlurb] = useState("");
  const [seal, setSeal] = useState("");
  const [glyph, setGlyph] = useState("🌸");
  const [color, setColor] = useState("#C14A3F");
  const [layout, setLayout] = useState<"classic" | "list" | "gallery">("classic");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) { setError("请输入藏名"); return; }
    if (!seal.trim()) { setError("请输入印章单字"); return; }

    setCreating(true);
    setError("");
    try {
      const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") +
        "-" + Date.now().toString(36);
      const id = await addCollection({
        slug,
        name: name.trim(),
        subname: subname.trim() || name.trim(),
        blurb: blurb.trim() || "藏 · 诗词",
        seal: seal.trim().slice(0, 1),
        glyph,
        color,
        accent: color + "99",
        background: "rice-paper",
        layout,
      });
      router.push(`/yuan/${slug}`);
    } catch (e) {
      setError("创建失败，请重试");
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="paper-texture min-h-screen flex flex-col">
      <Navbar />
      <main className="page-container flex-1">
        <div className="max-w-xl mx-auto px-6 py-12">
          {/* 返回 */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-ink-light hover:text-ink transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              墨韵阁
            </Link>
          </div>

          <div className="text-center mb-10">
            <h1 className="font-[var(--font-mashan)] text-4xl text-ink-dark mb-2" style={{ fontFamily: "var(--font-mashan)" }}>
              创建新藏
            </h1>
            <p className="text-ink-light text-sm">为你的诗词收藏开辟一方天地</p>
          </div>

          <div className="space-y-6">
            {/* 藏名 */}
            <div>
              <label className="block text-xs text-ink-light mb-2 tracking-wider uppercase">藏名 <span className="text-red-400">*</span></label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="例如：月下山河"
                className="w-full px-4 py-3 rounded-lg bg-white border border-ink/10 text-ink-dark text-lg outline-none focus:border-cinnabar/40 transition-colors"
                style={{ fontFamily: "var(--font-mashan)" }} />
            </div>

            {/* 副标 */}
            <div>
              <label className="block text-xs text-ink-light mb-2 tracking-wider uppercase">副标</label>
              <input type="text" value={subname} onChange={(e) => setSubname(e.target.value)}
                placeholder="例如：山川风物"
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-ink/10 text-ink-dark outline-none focus:border-cinnabar/40 transition-colors" />
            </div>

            {/* 简介 */}
            <div>
              <label className="block text-xs text-ink-light mb-2 tracking-wider uppercase">简介</label>
              <textarea value={blurb} onChange={(e) => setBlurb(e.target.value)}
                placeholder="一句诗，或一句话"
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-ink/10 text-ink-dark outline-none focus:border-cinnabar/40 transition-colors resize-none h-20" />
            </div>

            {/* 印章单字 */}
            <div>
              <label className="block text-xs text-ink-light mb-2 tracking-wider uppercase">印章单字 <span className="text-red-400">*</span></label>
              <div className="flex gap-3">
                <input type="text" value={seal} onChange={(e) => setSeal(e.target.value.slice(0, 1))}
                  placeholder="一个字，如：山"
                  maxLength={1}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-ink/10 text-ink-dark text-center text-xl outline-none focus:border-cinnabar/40 transition-colors"
                  style={{ fontFamily: "serif", fontSize: "20px" }} />
                {seal && (
                  <div className="flex-shrink-0" style={{ filter: `drop-shadow(0 2px 4px ${color}30)` }}>
                    <svg viewBox="0 0 100 100" width="52" height="52">
                      <rect x="5" y="5" width="90" height="90" rx="3" fill={color} />
                      <rect x="9" y="9" width="82" height="82" rx="2" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
                      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="50" fontWeight="900" fontFamily="serif">{seal}</text>
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* 主题图标 */}
            <div>
              <label className="block text-xs text-ink-light mb-2 tracking-wider uppercase">图标</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_GLYPHS.map((g) => (
                  <button key={g} onClick={() => setGlyph(g)}
                    className={cn("w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-all", glyph === g ? "border-current bg-ink/5" : "border-ink/10 hover:border-ink/20")} />
                ))}
              </div>
            </div>

            {/* 主色 */}
            <div>
              <label className="block text-xs text-ink-light mb-2 tracking-wider uppercase">主色</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button key={c.color} onClick={() => setColor(c.color)}
                    className={cn("w-8 h-8 rounded-full border-2 transition-all", color === c.color ? "border-ink scale-110" : "border-transparent hover:scale-105")}
                    style={{ backgroundColor: c.color }}
                    title={c.name} />
                ))}
              </div>
            </div>

            {/* 布局 */}
            <div>
              <label className="block text-xs text-ink-light mb-2 tracking-wider uppercase">布局</label>
              <div className="grid grid-cols-3 gap-2">
                {LAYOUT_OPTIONS.map((opt) => (
                  <button key={opt.key} onClick={() => setLayout(opt.key)}
                    className={cn("p-3 rounded-lg border text-center transition-all", layout === opt.key ? "border-current bg-ink/5" : "border-ink/10 hover:border-ink/20")}>
                    <div className="text-sm font-medium text-ink-dark">{opt.label}</div>
                    <div className="text-[10px] text-ink-light mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 预览 */}
            <div className="p-6 rounded-xl bg-white/60 border border-ink/8">
              <div className="text-xs text-ink-light/50 mb-3 uppercase tracking-wider">预览</div>
              <div className="flex items-center gap-4">
                <div style={{ filter: `drop-shadow(0 3px 6px ${color}30)` }}>
                  <svg viewBox="0 0 100 100" width="60" height="60">
                    <rect x="4" y="4" width="92" height="92" rx="3" fill={color} />
                    <rect x="9" y="9" width="82" height="82" rx="2" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
                    <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="50" fontWeight="900" fontFamily="serif">{seal || "藏"}</text>
                  </svg>
                </div>
                <div>
                  <div className="text-lg text-ink-dark" style={{ fontFamily: "var(--font-mashan)" }}>{name || "藏名"}</div>
                  <div className="text-xs" style={{ color: `${color}90` }}>{subname || name || "副标"}</div>
                  <div className="text-sm text-ink-light mt-1">{blurb || "一句简介"}</div>
                </div>
              </div>
            </div>

            {/* 错误 */}
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            {/* 创建按钮 */}
            <motion.button
              onClick={handleCreate}
              disabled={creating}
              whileTap={{ scale: 0.98 }}
              className={cn("w-full py-3.5 rounded-lg text-white font-medium text-sm transition-all", creating ? "bg-ink/40 cursor-not-allowed" : "hover:opacity-90")}
              style={{ backgroundColor: creating ? undefined : color }}
            >
              {creating ? "创建中..." : "开藏立派"}
            </motion.button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
