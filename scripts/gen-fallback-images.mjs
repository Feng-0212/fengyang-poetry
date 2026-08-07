// ============================================================
// 墨韵阁 - AI 配图回退图池生成脚本
// 生成 public/images/fallback/*.svg（水墨风季节回退图）
// 用法: node scripts/gen-fallback-images.mjs
// 说明: AI 生图全部失败时由 /api/ai/image 返回这些图，避免 404 破图。
// ============================================================
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "images", "fallback");

// 季节调色板（与 solarterms.ts 的季节色呼应）
const PALETTES = {
  spring: { bg1: "#F5F0E8", bg2: "#E2E8CE", hill: "#8B9A6B", moon: "#E8D4A8", label: "春 · 回退图" },
  summer: { bg1: "#F5F0E8", bg2: "#D8E6DC", hill: "#5A8A7A", moon: "#F0E0B8", label: "夏 · 回退图" },
  autumn: { bg1: "#F5F0E8", bg2: "#E8DAC2", hill: "#B87A50", moon: "#E8C890", label: "秋 · 回退图" },
  winter: { bg1: "#F2F2F6", bg2: "#D6DEE8", hill: "#6878A8", moon: "#E8E8F2", label: "冬 · 回退图" },
  default: { bg1: "#F5F0E8", bg2: "#DDD6C8", hill: "#8B8778", moon: "#E0D0B0", label: "墨 · 回退图" },
};

// 三套山形曲线（n=0/1/2 不同构图）
const HILLS = [
  ["M0,540 Q270,420 540,500 T1080,470 L1080,720 L0,720 Z", "M0,620 Q320,530 620,590 T1080,580 L1080,720 L0,720 Z"],
  ["M0,500 Q300,380 600,470 T1080,430 L1080,720 L0,720 Z", "M0,650 Q360,540 660,610 T1080,600 L1080,720 L0,720 Z"],
  ["M0,570 Q250,450 520,530 T1080,500 L1080,720 L0,720 Z", "M0,630 Q400,510 680,590 T1080,560 L1080,720 L0,720 Z"],
];

// 节气印章字（可选装饰）
const SEAL_CHARS = ["春", "夏", "秋", "冬", "墨"];

function buildSvg(season, n, p) {
  const [hillFar, hillNear] = HILLS[n % HILLS.length];
  const moonCx = 700 + n * 60;
  const moonCy = 160 + (n % 2) * 40;
  const petalPos = [
    [240, 300], [300, 250], [200, 380], [340, 340],
  ];
  const snowPos = [
    [180, 240], [260, 320], [420, 220], [560, 300], [700, 250], [830, 340], [930, 220],
  ];

  const petals = season === "spring"
    ? petalPos.map(([x, y], i) =>
        `<ellipse cx="${x}" cy="${y}" rx="12" ry="7" fill="${p.hill}" opacity="${0.35 + (i % 3) * 0.15}" transform="rotate(${20 + i * 30} ${x} ${y})"/>`
      ).join("\n  ")
    : "";
  const snow = season === "winter"
    ? snowPos.map(([x, y], i) =>
        `<circle cx="${x}" cy="${y}" r="${3 + (i % 3)}" fill="#FFFFFF" opacity="0.7"/>`
      ).join("\n  ")
    : "";
  const leaf = season === "autumn"
    ? `<path d="M860,220 q-18,-24 -40,-20 q-6,24 14,34 q18,8 26,-14 Z" fill="#C87040" opacity="0.5"/>
  <path d="M180,300 q-16,-22 -36,-18 q-5,22 12,30 q16,8 24,-12 Z" fill="#B85A30" opacity="0.45"/>`
    : "";
  const summer = season === "summer"
    ? `<circle cx="240" cy="230" r="46" fill="${p.moon}" opacity="0.5"/>
  <circle cx="250" cy="220" r="46" fill="${p.bg2}" opacity="0.6"/>`
    : "";
  const moon = (season === "spring" || season === "default" || season === "summer")
    ? `<circle cx="${moonCx}" cy="${moonCy}" r="66" fill="${p.moon}" opacity="0.85"/>`
    : (season === "autumn" || season === "winter") ? `<circle cx="${moonCx}" cy="${moonCy}" r="60" fill="${p.moon}" opacity="0.8"/>` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 720">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.bg1}"/>
      <stop offset="100%" stop-color="${p.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="720" fill="url(#g)"/>
  ${petals}
  ${snow}
  ${leaf}
  ${summer}
  ${moon}
  <path d="${hillFar}" fill="${p.hill}" opacity="0.22"/>
  <path d="${hillNear}" fill="${p.hill}" opacity="0.34"/>
  <g transform="translate(90, 560)" opacity="0.55">
    <rect x="0" y="0" width="86" height="86" rx="4" fill="${p.hill}"/>
    <rect x="6" y="6" width="74" height="74" rx="2" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.5"/>
    <text x="43" y="60" text-anchor="middle" font-family="serif" font-size="48" font-weight="900" fill="#FFFFFF">${SEAL_CHARS[n % SEAL_CHARS.length]}</text>
  </g>
  <text x="540" y="684" text-anchor="middle" font-family="serif" font-size="26" fill="${p.hill}" opacity="0.45">${p.label}</text>
</svg>
`;
}

mkdirSync(OUT_DIR, { recursive: true });
const seasons = ["spring", "summer", "autumn", "winter", "default"];
let count = 0;
for (const season of seasons) {
  const files = season === "default" ? 2 : 3;
  for (let n = 0; n < files; n++) {
    const file = `${season}-${n + 1}.svg`;
    writeFileSync(join(OUT_DIR, file), buildSvg(season, n, PALETTES[season]), "utf8");
    console.log(`✓ ${file}`);
    count++;
  }
}
console.log(`完成：生成 ${count} 张回退图 → ${OUT_DIR}`);
