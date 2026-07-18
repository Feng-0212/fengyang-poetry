// ============================================================
// 四时墨苑 - 氛围动效层
// ============================================================
"use client";

import { motion } from "framer-motion";
import { useAtmosphere } from "@/hooks/useAtmosphere";
import type { SolarTermMeta } from "@/types/poem";

interface Props {
  solarTerm: SolarTermMeta;
  enabled?: boolean;
}

export default function AtmosphereLayer({ solarTerm, enabled = true }: Props) {
  if (!enabled) return null;

  const data = useAtmosphere(solarTerm);
  if (!data || data.animation === "none") return null;

  const { particles, animation, color } = data;

  const renderParticle = (p: (typeof particles)[0]) => (
    <motion.div
      key={p.id}
      className="absolute pointer-events-none"
      style={{
        left: `${p.x}%`,
        top: `${p.y}%`,
        width: p.size,
        height: p.size,
        ["--drift" as string]: `${p.drift}px`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: p.opacity }}
      transition={{ duration: 1, delay: p.delay }}
    >
      {animation === "snow" && (
        <div
          className="snow-particle w-full h-full"
          style={{
            background: `rgba(255,255,255,${p.opacity})`,
            borderRadius: "50%",
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            width: p.size,
            height: p.size,
            boxShadow: "0 0 4px rgba(255,255,255,0.5)",
          }}
        />
      )}

      {animation === "leaf" && (
        <svg
          width={p.size * 1.5}
          height={p.size}
          viewBox="0 0 24 16"
          fill={color}
          opacity={p.opacity}
          style={{ animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }}
          className="leaf-particle"
        >
          <path d="M12 0C7.58 0 4 3.58 4 8c0 4.42 3.58 8 8 8s8-3.58 8-8c0-4.42-3.58-8-8-8zm0 2c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6 2.69-6 6-6z" opacity="0.3" />
          <path d="M12 2C9 2 6 5 6 9c0 2 1 4 3 5.5V16h6v-1.5c2-1.5 3-3.5 3-5.5 0-4-3-7-6-7z" />
        </svg>
      )}

      {animation === "firefly" && (
        <div
          className="firefly-particle"
          style={{
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      )}

      {animation === "rain" && (
        <div
          className="rain-particle"
          style={{
            height: p.size * 8,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            width: Math.max(1, p.size * 0.3),
          }}
        />
      )}

      {animation === "petal" && (
        <div
          className="petal-particle"
          style={{
            width: p.size,
            height: p.size,
            background: `linear-gradient(135deg, rgba(255,200,200,${p.opacity}), rgba(255,180,180,${p.opacity * 0.5}))`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      )}
    </motion.div>
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* 主氛围渐变 */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(ellipse at 80% 20%, ${color}40 0%, transparent 50%),
                       radial-gradient(ellipse at 20% 80%, ${color}20 0%, transparent 40%)`,
        }}
      />

      {/* 粒子层 */}
      <div className="relative w-full h-full">
        {particles.slice(0, 40).map(renderParticle)}
      </div>
    </div>
  );
}
