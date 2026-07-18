// ============================================================
// 四时墨苑 - 页脚
// ============================================================
"use client";

import { getSeasonName } from "@/lib/solarterms";
import { useSolarTerm } from "@/hooks/useSolarTerm";

export default function Footer() {
  const solarTerm = useSolarTerm();
  const seasonName = getSeasonName(solarTerm.season);

  return (
    <footer className="mt-24 py-12 border-t border-ink/10">
      <div className="max-w-6xl mx-auto px-6 text-center">
        {/* 节气印章 */}
        <div
          className="seal-stamp mx-auto mb-6"
          style={{ backgroundColor: solarTerm.color }}
        >
          {solarTerm.name}
        </div>

        {/* 诗句装饰 */}
        <p className="text-ink-light text-sm mb-4 font-[var(--font-lxgw)] italic">
          {getSeasonQuote(solarTerm.season)}
        </p>

        {/* 底部信息 */}
        <div className="flex items-center justify-center gap-4 text-xs text-ink-light">
          <span className="font-[var(--font-mashan)] text-base text-ink/40">
            四时墨苑
          </span>
          <span className="opacity-40">·</span>
          <span>{seasonName}季</span>
          <span className="opacity-40">·</span>
          <span>四时有墨，苑藏诗意</span>
        </div>
      </div>
    </footer>
  );
}

function getSeasonQuote(season: string): string {
  const quotes: Record<string, string> = {
    spring: "春有百花秋有月，夏有凉风冬有雪",
    summer: "接天莲叶无穷碧，映日荷花别样红",
    autumn: "停车坐爱枫林晚，霜叶红于二月花",
    winter: "忽如一夜春风来，千树万树梨花开",
  };
  return quotes[season] || quotes.spring;
}
