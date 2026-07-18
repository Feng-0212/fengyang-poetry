// ============================================================
// 四时墨苑 - 卷轴展开动画组件
// ============================================================
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  color?: string;
  delay?: number;
}

/**
 * 卷轴从两侧展开，诗词从中间显出
 */
export default function ScrollUnroll({ children, color = "#C14A3F", delay = 0.2 }: Props) {
  return (
    <div className="relative">
      {/* 左卷轴 */}
      <motion.div
        className="absolute -left-3 top-0 bottom-0 w-6 z-20 pointer-events-none"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay }}
      >
        <div
          className="w-full h-full rounded-l-sm shadow-md"
          style={{
            background: `linear-gradient(180deg, ${color}40 0%, ${color} 50%, ${color}40 100%)`,
          }}
        >
          {/* 卷轴顶端装饰 */}
          <div
            className="absolute -top-1 left-0 right-0 h-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          {/* 卷轴底端装饰 */}
          <div
            className="absolute -bottom-1 left-0 right-0 h-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      </motion.div>

      {/* 右卷轴 */}
      <motion.div
        className="absolute -right-3 top-0 bottom-0 w-6 z-20 pointer-events-none"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay }}
      >
        <div
          className="w-full h-full rounded-r-sm shadow-md"
          style={{
            background: `linear-gradient(180deg, ${color}40 0%, ${color} 50%, ${color}40 100%)`,
          }}
        >
          <div
            className="absolute -top-1 left-0 right-0 h-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div
            className="absolute -bottom-1 left-0 right-0 h-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      </motion.div>

      {/* 主内容（从卷轴之间展开） */}
      <motion.div
        initial={{ clipPath: "inset(0 50% 0 50%)", opacity: 0 }}
        animate={{ clipPath: "inset(0 0% 0 0%)", opacity: 1 }}
        transition={{
          duration: 1.0,
          ease: [0.4, 0, 0.2, 1],
          delay: delay + 0.2,
        }}
        className="relative"
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * 毛笔逐字书写动画
 */
export function BrushWrite({
  text,
  delay = 0,
  charDelay = 0.15,
  className = "",
  style = {},
}: {
  text: string;
  delay?: number;
  charDelay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const chars = Array.from(text); // 处理中文+标点

  return (
    <span className={`inline-block ${className}`} style={style}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0.7, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            delay: delay + i * charDelay,
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="inline-block"
          style={{
            transformOrigin: "center",
          }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * 墨迹晕染动画（从中心向外扩散）
 */
export function InkSpread({
  children,
  delay = 0,
  duration = 0.8,
  color = "#1A1A1A",
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  color?: string;
}) {
  return (
    <motion.div
      className="relative inline-block"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        delay,
        duration,
        ease: [0.1, 0.8, 0.3, 1],
      }}
    >
      {children}
      {/* 墨迹光晕 */}
      <motion.div
        className="absolute inset-0 -z-10 rounded-lg"
        style={{
          background: `radial-gradient(ellipse at center, ${color}15 0%, transparent 70%)`,
        }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 0.6 }}
        transition={{
          delay: delay + duration * 0.5,
          duration: duration * 1.2,
        }}
      />
    </motion.div>
  );
}
