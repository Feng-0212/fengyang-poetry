// ============================================================
// 四时墨苑 - 氛围动效 Hook
// ============================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import type { SolarTermMeta } from "@/types/poem";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  drift: number; // 横向漂移
}

function generateParticles(type: SolarTermMeta["animation"], count: number): Particle[] {
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const base = {
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      duration: Math.random() * 6 + 8,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.6 + 0.3,
      drift: (Math.random() - 0.5) * 30,
    };

    if (type === "snow") {
      particles.push({ ...base, size: Math.random() * 6 + 2, duration: Math.random() * 8 + 12 });
    } else if (type === "leaf") {
      particles.push({ ...base, size: Math.random() * 12 + 8 });
    } else if (type === "firefly") {
      particles.push({ ...base, size: Math.random() * 4 + 2, duration: Math.random() * 4 + 2 });
    } else if (type === "rain") {
      particles.push({ ...base, size: Math.random() * 2 + 1, duration: Math.random() * 1 + 0.5, drift: Math.random() * 5 });
    } else if (type === "petal") {
      particles.push({ ...base, size: Math.random() * 8 + 4 });
    } else {
      particles.push(base);
    }
  }

  return particles;
}

export function useAtmosphere(solarTerm: SolarTermMeta) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mounted, setMounted] = useState(false);

  const updateParticles = useCallback(() => {
    const count = solarTerm.animation === "snow" ? 50
      : solarTerm.animation === "leaf" ? 20
      : solarTerm.animation === "firefly" ? 30
      : solarTerm.animation === "rain" ? 80
      : solarTerm.animation === "petal" ? 25
      : 0;
    setParticles(generateParticles(solarTerm.animation, count));
  }, [solarTerm]);

  useEffect(() => {
    setMounted(true);
    updateParticles();
  }, [updateParticles]);

  // 节气变化时重新生成粒子
  useEffect(() => {
    updateParticles();
  }, [solarTerm.key, updateParticles]);

  if (!mounted) return null;

  return { particles, animation: solarTerm.animation, color: solarTerm.color };
}
