// ============================================================
// 四时墨苑 - 节气 Hook
// ============================================================
"use client";

import { useState, useEffect } from "react";
import { getSolarTerm } from "@/lib/solarterms";
import type { SolarTermMeta } from "@/types/poem";

export function useSolarTerm() {
  const [solarTerm, setSolarTerm] = useState<SolarTermMeta>(() =>
    getSolarTerm(new Date())
  );

  // 每小时更新一次当前节气
  useEffect(() => {
    // 初始化
    setSolarTerm(getSolarTerm(new Date()));

    // 每小时检查一次
    const interval = setInterval(() => {
      setSolarTerm(getSolarTerm(new Date()));
    }, 3600 * 1000);

    return () => clearInterval(interval);
  }, []);

  return solarTerm;
}
