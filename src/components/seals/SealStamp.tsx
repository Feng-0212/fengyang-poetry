// ============================================================
// 四时墨苑 - 24 节气印章 SVG 组件
// ============================================================
"use client";

import { motion } from "framer-motion";
import type { SolarTermKey } from "@/types/poem";

interface Props {
  term: SolarTermKey | "诗" | "墨" | "童";
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  color?: string;
}

// 节气名 → 单字映射（艺术化压缩）
const SEAL_NAMES: Record<string, string> = {
  // 节气
  lichun: "春",
  yushui: "雨",
  jingzhe: "雷",
  chunfen: "分",
  qingming: "清",
  guyu: "谷",
  lixia: "夏",
  xiaoman: "满",
  mangzhong: "芒",
  xiazhi: "至",
  xiaoshu: "暑",
  dashu: "热",
  liqiu: "秋",
  chushu: "处",
  bailu: "露",
  qiufen: "分",
  hanlu: "寒",
  shuangjiang: "霜",
  lidong: "冬",
  xiaoxue: "雪",
  daxue: "雪",
  dongzhi: "至",
  xiaohan: "寒",
  dahan: "寒",
  // 装饰字
  诗: "诗",
  墨: "墨",
  童: "童",
};

const SIZE_MAP = {
  sm: 40,
  md: 56,
  lg: 80,
  xl: 120,
};

export default function SealStamp({ term, size = "md", animated = true, color }: Props) {
  const char = SEAL_NAMES[term] || "诗";
  const pixelSize = SIZE_MAP[size];
  const isLarge = size === "lg" || size === "xl";
  const fillColor = color || "#C14A3F";

  return (
    <motion.div
      className="relative inline-block"
      style={{ width: pixelSize, height: pixelSize }}
      initial={animated ? { scale: 0, rotate: -10, opacity: 0 } : undefined}
      animate={animated ? { scale: 1, rotate: 0, opacity: 1 } : undefined}
      transition={animated ? { type: "spring", stiffness: 300, damping: 18 } : undefined}
    >
      <svg
        viewBox="0 0 100 100"
        width={pixelSize}
        height={pixelSize}
        className="relative z-10"
      >
        {/* 外粗框 */}
        <rect
          x="6"
          y="6"
          width="88"
          height="88"
          rx="3"
          ry="3"
          fill="none"
          stroke={fillColor}
          strokeWidth="5"
        />
        {/* 内细框（双线效果） */}
        <rect
          x="11"
          y="11"
          width="78"
          height="78"
          rx="2"
          ry="2"
          fill="none"
          stroke={fillColor}
          strokeWidth="1.5"
          opacity="0.7"
        />
        {/* 印章主字 */}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fill={fillColor}
          fontSize={isLarge ? 48 : 42}
          fontWeight="900"
          fontFamily="serif"
          style={{
            fontFamily: "var(--font-mashan), 'STKaiti', 'KaiTi', serif",
          }}
        >
          {char}
        </text>
      </svg>

      {/* 墨迹飞溅效果（角落小点） */}
      {animated && (
        <>
          <motion.div
            className="absolute"
            style={{
              top: -2,
              right: -2,
              width: 4,
              height: 4,
              backgroundColor: fillColor,
              borderRadius: "50%",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          />
          <motion.div
            className="absolute"
            style={{
              bottom: -1,
              left: -1,
              width: 3,
              height: 3,
              backgroundColor: fillColor,
              borderRadius: "50%",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.5 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          />
        </>
      )}
    </motion.div>
  );
}

/**
 * 传统风格印章（朱砂填充）
 * 用于详情页等更正式的场景
 */
export function TraditionalSeal({
  term,
  size = "lg",
  color = "#C14A3F",
}: {
  term: SolarTermKey | string;
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
}) {
  const char = SEAL_NAMES[term] || "诗";
  const pixelSize = SIZE_MAP[size];

  return (
    <motion.div
      className="relative inline-block"
      style={{ width: pixelSize, height: pixelSize }}
      initial={{ scale: 1.3, opacity: 0, y: -20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay: 0.3,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width={pixelSize}
        height={pixelSize}
        className="drop-shadow-md"
      >
        {/* 朱砂填充背景 */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="2"
          fill={color}
        />
        {/* 边框（白色凹陷效果） */}
        <rect
          x="7"
          y="7"
          width="86"
          height="86"
          rx="1"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.3"
        />
        {/* 印章字（白色反白） */}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize={size === "xl" ? 56 : 50}
          fontWeight="900"
          fontFamily="serif"
        >
          {char}
        </text>
        {/* 朱砂斑驳纹理 */}
        <rect
          x="0"
          y="0"
          width="100"
          height="100"
          fill="url(#noise)"
        />
        <defs>
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
      </svg>
    </motion.div>
  );
}
