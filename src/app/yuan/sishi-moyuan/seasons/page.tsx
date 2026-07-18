// ============================================================
// 四时墨苑 - 节气诗库（/yuan/sishi-moyuan/seasons）
// ============================================================
"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PoemCard from "@/components/poem/PoemCard";
import AtmosphereLayer from "@/components/poem/AtmosphereLayer";
import { useSolarTerm } from "@/hooks/useSolarTerm";
import { SOLAR_TERMS_META, getSolarTermsBySeason, getSeasonName } from "@/lib/solarterms";
import { getPoemsBySolarTerm, getPoemsBySeason, getAllPoems } from "@/lib/db";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { SeasonKey, Poem } from "@/types/poem";
import { COLLECTION_IDS } from "@/types/poem";

const SEASONS: { key: SeasonKey; label: string; emoji: string }[] = [
  { key: "spring", label: "春", emoji: "🌸" },
  { key: "summer", label: "夏", emoji: "🍃" },
  { key: "autumn", label: "秋", emoji: "🍂" },
  { key: "winter", label: "冬", emoji: "❄️" },
];

export default function SeasonsPage() {
  return (
    <Suspense fallback={
      <div className="paper-texture min-h-screen">
        <div className="page-container flex items-center justify-center"><div className="text-center text-ink-light">加载中...</div></div>
      </div>
    }>
      <SeasonsContent />
    </Suspense>
  );
}

function SeasonsContent() {
  const searchParams = useSearchParams();
  const solarTermHook = useSolarTerm();

  const [selectedSeason, setSelectedSeason] = useState<SeasonKey | "">(
    (searchParams.get("season") as SeasonKey) || ""
  );
  const [selectedSolarTerm, setSelectedSolarTerm] = useState<string>(
    searchParams.get("solarTerm") || ""
  );

  useEffect(() => {
    const season = searchParams.get("season") as SeasonKey | null;
    const st = searchParams.get("solarTerm");
    if (season) setSelectedSeason(season);
    if (st) setSelectedSolarTerm(st);
  }, [searchParams]);

  const currentSolarTerm = selectedSolarTerm
    ? SOLAR_TERMS_META.find((m) => m.key === selectedSolarTerm)
    : null;
  const displaySeason = selectedSeason || solarTermHook.season;
  const solarTerms = getSolarTermsBySeason(displaySeason as SeasonKey);

  return (
    <div className="paper-texture min-h-screen">
      <AtmosphereLayer solarTerm={currentSolarTerm || solarTermHook} />
      <Navbar />

      <main className="page-container relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* 返回 */}
        <div className="mb-8">
          <Link href="/yuan/sishi-moyuan" className="inline-flex items-center gap-2 text-sm text-ink-light hover:text-ink transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
            四时墨苑
          </Link>
        </div>

        <div className="text-center mb-10">
          <h1 className="font-[var(--font-mashan)] text-4xl text-ink-dark mb-2">节气诗库</h1>
          <p className="text-ink-light text-sm">顺四时之序，藏诗意于心</p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          <button onClick={() => { setSelectedSeason(""); setSelectedSolarTerm(""); }}
            className={cn("px-4 py-2 rounded-lg text-sm transition-all border", selectedSeason === "" && selectedSolarTerm === "" ? "text-white border-transparent" : "text-ink-light border-ink/10 hover:border-ink/20")}
            style={selectedSeason === "" && selectedSolarTerm === "" ? { backgroundColor: solarTermHook.color } : undefined}>全部</button>
          {SEASONS.map((s) => (
            <button key={s.key} onClick={() => { setSelectedSeason(s.key); setSelectedSolarTerm(""); }}
              className={cn("px-4 py-2 rounded-lg text-sm transition-all border", selectedSeason === s.key ? "text-white border-transparent" : "text-ink-light border-ink/10 hover:border-ink/20")}
              style={selectedSeason === s.key ? { backgroundColor: solarTermHook.color } : undefined}>{s.emoji} {s.label}季</button>
          ))}
        </div>

        {selectedSeason && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              {solarTerms.map((st) => (
                <button key={st.key} onClick={() => setSelectedSolarTerm(st.key)}
                  className={cn("px-3 py-1.5 rounded-full text-xs transition-all border", selectedSolarTerm === st.key ? "text-white border-transparent" : "text-ink-light border-ink/10 hover:border-ink/20")}
                  style={selectedSolarTerm === st.key ? { backgroundColor: st.color } : undefined}>{st.name}</button>
              ))}
            </div>
          </motion.div>
        )}

        {currentSolarTerm && (
          <motion.div key={currentSolarTerm.key} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full"
              style={{ backgroundColor: `${currentSolarTerm.color}12`, border: `1px solid ${currentSolarTerm.color}30` }}>
              <div className="seal-stamp text-xs" style={{ backgroundColor: currentSolarTerm.color }}>{currentSolarTerm.name}</div>
              <span className="text-sm text-ink">{currentSolarTerm.imagery}</span>
            </div>
          </motion.div>
        )}

        <SolarTermPoemGrid
          season={selectedSeason || undefined}
          solarTerm={selectedSolarTerm || undefined}
          collectionId={COLLECTION_IDS.SISHI_MOYUAN}
        />

        <div className="text-center mt-12">
          <p className="text-ink-light text-sm mb-4">还没有这个节气的诗词</p>
          <Link href="/yuan/sishi-moyuan/write" className="inline-flex items-center gap-2 text-sm text-cinnabar hover:underline">
            写一首关于{currentSolarTerm?.name || getSeasonName(displaySeason as SeasonKey)}的诗 →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function SolarTermPoemGrid({
  season, solarTerm, collectionId,
}: { season?: string; solarTerm?: string; collectionId?: string }) {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    import("@/lib/db").then(async (db) => {
      let data: Poem[];
      if (solarTerm) {
        data = await db.getPoemsBySolarTerm(solarTerm);
      } else if (season) {
        data = await db.getPoemsBySeason(season);
      } else {
        data = await db.getAllPoems();
      }
      // 过滤藏 + 未删除
      data = data.filter((p) => !p.deletedAt && (!collectionId || p.collectionId === collectionId));
      setPoems(data);
      setLoading(false);
    });
  }, [season, solarTerm, collectionId]);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => <div key={i} className="skeleton rounded-xl h-44" />)}
    </div>
  );

  if (poems.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {poems.map((poem, i) => <PoemCard key={poem.id} poem={poem} index={i} />)}
    </div>
  );
}
