// ============================================================
// 诗藏家族 · 访问统计（四站统一埋点，数据存 Upstash Redis）
// 指标：
//   在线人数   = 近 5 分钟内心跳过的访客（按站点 5 分钟窗口集合）
//   当日访客   = 当日去重访客（uv 集合）
//   当日浏览   = 当日页面打开次数（pv 计数，心跳不计）
//   近 N 天    = 按日 uv / pv 序列（键 TTL 60 天，趋势图可看 30 天）
//   总计       = 全期去重访客 + 全期浏览（不过期）
// 日期均按东八区（UTC+8）切分。
// ============================================================
import { getKv } from "./kv";

export const STAT_SITES = ["portal", "moyun", "shicang", "agent"] as const;
export type StatSite = (typeof STAT_SITES)[number];

/** 东八区当日日期串 YYYY-MM-DD */
function cnDate(d = new Date()): string {
  return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

/** 东八区近 N 天日期串（含今天，旧→新） */
function cnDates(n: number): string[] {
  const out: string[] = [];
  const now = Date.now();
  for (let i = n - 1; i >= 0; i--) out.push(cnDate(new Date(now - i * 86400 * 1000)));
  return out;
}

/** 采集一次访问（心跳 hb=true 时只刷新在线窗口，不计浏览量） */
export async function statCollect(site: string, vid: string, hb: boolean): Promise<void> {
  const kv = await getKv();
  if (!kv) return;
  const s = (STAT_SITES as readonly string[]).includes(site) ? site : "other";
  const v = String(vid).slice(0, 64);
  if (!v) return;
  try {
    // 在线窗口：5 分钟一个集合，多留 10 分钟过期
    const window = Math.floor(Date.now() / 300000);
    await kv.sadd(`stat:onl:${s}:${window}`, v);
    await kv.expire(`stat:onl:${s}:${window}`, 900);
    if (hb) return; // 心跳不计 uv/pv
    const date = cnDate();
    const ttl = 60 * 86400;
    await kv.sadd(`stat:uv:${date}`, v);
    await kv.expire(`stat:uv:${date}`, ttl);
    await kv.incr(`stat:pv:${date}`);
    await kv.expire(`stat:pv:${date}`, ttl);
    await kv.sadd(`stat:uv:${date}:${s}`, v);
    await kv.expire(`stat:uv:${date}:${s}`, ttl);
    await kv.incr(`stat:pv:${date}:${s}`);
    await kv.expire(`stat:pv:${date}:${s}`, ttl);
    await kv.sadd("stat:uv:all", v);
    await kv.incr("stat:pv:all");
  } catch {
    /* 统计失败不影响业务 */
  }
}

async function scard(kv: NonNullable<Awaited<ReturnType<typeof getKv>>>, key: string): Promise<number> {
  try { return await kv.scard(key); } catch { return 0; }
}
async function getPv(kv: NonNullable<Awaited<ReturnType<typeof getKv>>>, key: string): Promise<number> {
  try { return (await kv.get<number>(key)) ?? 0; } catch { return 0; }
}

/** 近 5 分钟在线人数（全部站点合计；传 site 则单站） */
export async function statOnline(site?: string): Promise<number> {
  const kv = await getKv();
  if (!kv) return 0;
  const window = Math.floor(Date.now() / 300000);
  const sites = site ? [site] : [...STAT_SITES];
  let sum = 0;
  for (const s of sites) sum += await scard(kv, `stat:onl:${s}:${window}`);
  return sum;
}

/** 单日 uv / pv（可选站点） */
export async function statDay(date: string, site?: string): Promise<{ uv: number; pv: number }> {
  const kv = await getKv();
  if (!kv) return { uv: 0, pv: 0 };
  const suffix = site ? `:${site}` : "";
  const uv = await scard(kv, `stat:uv:${date}${suffix}`);
  const pv = await getPv(kv, `stat:pv:${date}${suffix}`);
  return { uv, pv };
}

export interface StatsSummary {
  online: number;
  today: { date: string; uv: number; pv: number };
  todayBySite: Array<{ site: string; uv: number; pv: number }>;
  days: Array<{ date: string; uv: number; pv: number }>; // 近 30 天（旧→新）
  last7: Array<{ date: string; uv: number; pv: number }>; // 近 7 天
  allTime: { uv: number; pv: number };
}

export async function statSummary(): Promise<StatsSummary> {
  const kv = await getKv();
  if (!kv) {
    return { online: 0, today: { date: cnDate(), uv: 0, pv: 0 }, todayBySite: [], days: [], last7: [], allTime: { uv: 0, pv: 0 } };
  }
  const today = cnDate();
  const [online, tUv, tPv, allUv, allPv] = await Promise.all([
    statOnline(),
    statDay(today).then((d) => d.uv),
    statDay(today).then((d) => d.pv),
    scard(kv, "stat:uv:all"),
    getPv(kv, "stat:pv:all"),
  ]);
  const day30 = cnDates(30);
  const days = await Promise.all(day30.map(async (d) => ({ date: d, ...(await statDay(d)) })));
  const todayBySite = await Promise.all(
    STAT_SITES.map(async (s) => ({ site: s, ...(await statDay(today, s)) }))
  );
  return {
    online,
    today: { date: today, uv: tUv, pv: tPv },
    todayBySite,
    days,
    last7: days.slice(-7),
    allTime: { uv: allUv, pv: allPv },
  };
}
