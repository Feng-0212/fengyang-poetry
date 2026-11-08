// ============================================================
// 诗藏家族 - 访问统计仪表盘（/site-stats）
// 仅管理员可见（ADMIN_EMAIL 匹配的登录账号，或 ?key=STATS_SECRET）
// 展示：当前在线 / 今日访客与浏览 / 近 7 天 / 近 30 天趋势 / 全期总计
// 每 15 秒自动刷新
// ============================================================
"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getToken } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface Summary {
  online: number;
  today: { date: string; uv: number; pv: number };
  todayBySite: Array<{ site: string; uv: number; pv: number }>;
  days: Array<{ date: string; uv: number; pv: number }>;
  last7: Array<{ date: string; uv: number; pv: number }>;
  allTime: { uv: number; pv: number };
}

const SITE_NAME: Record<string, string> = {
  portal: "门户",
  moyun: "墨韵阁",
  shicang: "诗藏书库",
  agent: "AI 问答",
  other: "其他",
};

const shortDate = (d: string) => d.slice(5).replace("-", "/");

/** 纯 SVG 柱状趋势图 */
function TrendChart({ data, height = 180 }: { data: Array<{ date: string; uv: number }>; height?: number }) {
  const w = 900;
  const h = height;
  const pad = { l: 40, r: 16, t: 18, b: 30 };
  const max = Math.max(1, ...data.map((d) => d.uv));
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const bw = Math.max(6, iw / data.length - 6);
  const ticks = [0, Math.ceil(max / 2), max];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="每日访客趋势图">
      {ticks.map((t, i) => {
        const y = pad.t + ih - (t / max) * ih;
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
            <text x={pad.l - 6} y={y + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.45">{t}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = pad.l + (i + 0.5) * (iw / data.length) - bw / 2;
        const bh = Math.max(d.uv > 0 ? 2 : 0, (d.uv / max) * ih);
        return (
          <g key={d.date}>
            <rect x={x} y={pad.t + ih - bh} width={bw} height={bh} rx={2} fill="#C14A3F" opacity={i === data.length - 1 ? 0.95 : 0.55}>
              <title>{`${d.date}：${d.uv} 位访客`}</title>
            </rect>
            {(data.length <= 8 || i % Math.ceil(data.length / 15) === 0 || i === data.length - 1) && (
              <text x={x + bw / 2} y={h - 10} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.45">
                {shortDate(d.date)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white/60 px-6 py-5 text-center shadow-ink">
      <div className="text-xs text-ink-light tracking-widest">{label}</div>
      <div className="mt-1 text-3xl font-bold text-cinnabar" style={{ fontFamily: "var(--font-lxgw)" }}>{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-light/70">{sub}</div>}
    </div>
  );
}

export default function SiteStatsPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState("");

  const load = useCallback(async () => {
    try {
      const key = new URLSearchParams(location.search).get("key") || "";
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`/api/stats/summary?key=${encodeURIComponent(key)}`, { headers, cache: "no-store" });
      if (res.status === 403) {
        setError("forbidden");
        return;
      }
      const j = await res.json();
      if (j.online === undefined) {
        setError("bad");
        return;
      }
      setData(j);
      setError(null);
      setUpdatedAt(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
    } catch {
      setError("网络错误");
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="paper-texture min-h-screen">
      <Navbar />
      <main className="page-container relative z-10">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="mb-8 text-center">
            <h1 className="font-[var(--font-mashan)] text-3xl text-ink-dark mb-1">访问统计</h1>
            <p className="text-xs text-ink-light">
              诗藏家族四站合计 · 每 15 秒自动刷新{updatedAt && ` · 更新于 ${updatedAt}`}
            </p>
          </div>

          {error === "forbidden" ? (
            <div className="mx-auto max-w-md rounded-2xl border border-ink/10 bg-white/70 p-8 text-center shadow-ink">
              <div className="mb-3 text-3xl">🔒</div>
              <p className="text-ink-dark mb-2">此处仅站长可见</p>
              <p className="text-sm leading-relaxed text-ink-light">
                请先<a href="/login" className="text-cinnabar mx-1">登录</a>
                管理员账号（ADMIN_EMAIL 匹配的邮箱）再回到本页；
                或在网址后加 <code className="rounded bg-ink/5 px-1">?key=STATS_SECRET</code> 访问。
              </p>
            </div>
          ) : error ? (
            <p className="text-center text-sm text-ink-light">加载失败（{error}），稍后自动重试…</p>
          ) : !data ? (
            <p className="text-center text-sm text-ink-light">加载中…</p>
          ) : (
            <>
              {/* 核心指标 */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard label="当前在线" value={data.online} sub="近 5 分钟活跃" />
                <StatCard label="今日访客" value={data.today.uv} sub="去重人数" />
                <StatCard label="今日浏览" value={data.today.pv} sub="页面打开次数" />
                <StatCard label="全期访客" value={data.allTime.uv} sub={`累计浏览 ${data.allTime.pv}`} />
              </div>

              {/* 今日分站 */}
              <section className="mt-8">
                <h2 className="mb-3 text-sm text-ink-light tracking-widest">今日分站</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {data.todayBySite.map((s) => (
                    <div key={s.site} className="rounded-xl border border-ink/10 bg-white/50 px-4 py-3">
                      <div className="text-sm text-ink-dark">{SITE_NAME[s.site] || s.site}</div>
                      <div className="mt-1 text-sm text-ink-light">
                        <span className="text-cinnabar font-bold">{s.uv}</span> 访客 · {s.pv} 浏览
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 近 7 天表 */}
              <section className="mt-8">
                <h2 className="mb-3 text-sm text-ink-light tracking-widest">近 7 天</h2>
                <div className="overflow-hidden rounded-xl border border-ink/10 bg-white/60">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ink/10 text-left text-ink-light">
                        <th className="px-4 py-2 font-normal">日期</th>
                        <th className="px-4 py-2 font-normal">访客</th>
                        <th className="px-4 py-2 font-normal">浏览</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...data.last7].reverse().map((d) => (
                        <tr key={d.date} className="border-b border-ink/5 last:border-0">
                          <td className="px-4 py-2 text-ink-dark">{d.date}（{["日", "一", "二", "三", "四", "五", "六"][new Date(d.date + "T12:00:00+08:00").getDay()]}）</td>
                          <td className="px-4 py-2 text-cinnabar font-bold">{d.uv}</td>
                          <td className="px-4 py-2 text-ink-light">{d.pv}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 30 天趋势 */}
              <section className="mt-8">
                <h2 className="mb-3 text-sm text-ink-light tracking-widest">近 30 天访客趋势</h2>
                <div className="rounded-2xl border border-ink/10 bg-white/60 p-4 shadow-ink">
                  <TrendChart data={data.days} />
                </div>
              </section>

              <p className="mt-6 text-center text-xs text-ink-light/60">
                统计自 2026-11-08 部署起累计 · 数据存于站点自有 Redis · 心跳即在线，关闭页面 5 分钟后自动下线
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
