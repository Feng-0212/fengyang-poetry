// ============================================================
// 四时墨苑 - 24节气导航（SolarTermNav）
// ============================================================
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSolarTerm } from "@/hooks/useSolarTerm";
import { SOLAR_TERMS_META } from "@/lib/solarterms";

export default function SolarTermNav() {
  const solarTerm = useSolarTerm();
  const pathname = usePathname() || "";
  const baseHref = pathname.replace(/\/seasons.*/, "") || "/yuan/sishi-moyuan";

  return (
    <div className="w-full">
      <div className="text-center text-xs text-ink-light/40 mb-3 tracking-widest uppercase">
        节气流转
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {SOLAR_TERMS_META.map((st, idx) => {
          const isActive = st.key === solarTerm.key;
          return (
            <Link
              key={st.key}
              href={`${baseHref}/seasons?solarTerm=${st.key}&season=${st.season}`}
              title={`${st.name} · ${st.dateRange}`}
              className={`
                relative w-7 h-7 rounded-full flex items-center justify-center text-[10px]
                font-medium transition-all duration-300
                ${isActive ? "ring-2 ring-offset-1" : "hover:scale-110"}
              `}
              style={
                isActive
                  ? {
                      backgroundColor: st.color,
                      color: "white",
                      boxShadow: `0 0 0 2px ${st.color}40`,
                    }
                  : {
                      backgroundColor: `${st.color}15`,
                      color: st.color,
                    }
              }
            >
              {st.name.slice(0, 1)}
              {idx > 0 && idx % 6 === 0 && (
                <div className="absolute -left-3 top-1/2 w-3 h-px bg-ink/10 -translate-y-1/2 hidden sm:block" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
