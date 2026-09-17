// ============================================================
// API: 诗藏词库整句验证代理（/api/shicang/verify）
// 两级验证：
//   ① 诗藏词库（权威，命中给出真实出处链接）
//   ② DeepSeek 兜底考证：词库未收录（版本异文等）或诗藏离线时，
//      由 AI 判断是否为真实诗句并给出出处（via=ai 标记，前端展示「AI 考证」）
// 环境变量：DEEPSEEK_API_KEY（必填才启用②）、DEEPSEEK_BASE_URL、DEEPSEEK_MODEL
// ============================================================
import { NextRequest, NextResponse } from "next/server";

const SHICANG_BASE = process.env.SHICANG_BASE || "https://shicang.poeagent.top";
const LLM_BASE = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
const LLM_KEY = process.env.DEEPSEEK_API_KEY || "";
const LLM_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/* 简易限流（实例内存级）：保护 DeepSeek 额度不被刷 */
const buckets = new Map<string, number[]>();
function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) return false;
  arr.push(now);
  buckets.set(key, arr);
  return true;
}

interface AiVerdict {
  real: boolean;
  title?: string | null;
  poet?: string | null;
  dynasty?: string | null;
  full_line?: string | null;
  note?: string | null;
}

async function aiVerify(line: string, char: string): Promise<AiVerdict | null> {
  if (!LLM_KEY) return null;
  const res = await fetch(`${LLM_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LLM_KEY}`,
    },
    signal: AbortSignal.timeout(20_000),
    body: JSON.stringify({
      model: LLM_MODEL,
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "你是中国古典诗词文献学审校。判断用户给出的「诗句」是否为古典诗词中真实存在的原句。\n" +
            "判定标准：\n" +
            "1. 逐字见于传世作品，或存在著名版本异文（如「春风又绿江南岸」一作「春风自绿江南岸」、「床前明月光」一作「床前看月光」），均算真实；\n" +
            "2. 凭空编造、多句拼接、记忆严重走样、现代仿古伪作，不算真实；\n" +
            "3. 不确定时从严判为不真实。\n" +
            '只输出 JSON：{"real":布尔,"title":"诗题或null","poet":"作者或null","dynasty":"朝代或null","full_line":"该句在原作中的完整原句","note":"不超过20字的简短说明"}',
        },
        {
          role: "user",
          content: `令字：${char || "（无）"}\n诗句：${line}`,
        },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  try {
    return JSON.parse(data.choices?.[0]?.message?.content || "");
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const char = (req.nextUrl.searchParams.get("char") || "").trim();

  if (!q) {
    return NextResponse.json({ ok: true, matched: false, reason: "empty" });
  }

  const params = new URLSearchParams({ q });
  if (char) params.set("char", char);

  let upstream: {
    ok?: boolean;
    matched?: boolean;
    reason?: string;
    line?: string;
    hits?: Array<Record<string, unknown>>;
  } | null = null;
  let dbDown = false;
  try {
    const res = await fetch(`${SHICANG_BASE}/api/verify-line?${params.toString()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
      headers: { "User-Agent": "moyun-pavilion/1.0 (feihua-ling)" },
    });
    if (res.ok) {
      upstream = await res.json();
    } else if (res.status >= 500) {
      dbDown = true;
    }
  } catch {
    dbDown = true;
  }

  /* ① 词库命中：直接采用（带真实出处链接） */
  if (upstream?.matched) {
    return NextResponse.json(upstream);
  }

  /* 前置校验类失败（空/太短/不含令字）：词库已给出原因，与真实性无关，不进 AI */
  if (upstream?.reason && upstream.reason !== "not_found") {
    return NextResponse.json(upstream);
  }

  /* ② DeepSeek 兜底考证（带限流） */
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allow(`ip:${ip}`, 8, 60_000) || !allow("global", 40, 60_000)) {
    return NextResponse.json(
      { ok: false, matched: false, reason: "rate_limited" },
      { status: 429 }
    );
  }

  try {
    const verdict = await aiVerify(q, char);
    if (verdict?.real) {
      return NextResponse.json({
        ok: true,
        matched: true,
        via: "ai",
        line: upstream?.line || q,
        hits: [
          {
            id: null,
            title: verdict.title || "出处待考",
            poet: verdict.poet || "佚名",
            dynasty: verdict.dynasty || null,
            line: verdict.full_line || q,
            url: null,
            note: verdict.note || null,
          },
        ],
      });
    }
    /* AI 判定非真实诗句（或未启用 AI）：按查无此句处理，附 AI 说明 */
    return NextResponse.json({
      ok: true,
      matched: false,
      reason: "not_found",
      ai_note: verdict?.note || null,
    });
  } catch {
    /* AI 调用异常：有词库结论则退回词库结论，否则报不可达 */
    if (upstream) return NextResponse.json(upstream);
    return NextResponse.json(
      { ok: false, matched: false, reason: "upstream_unreachable" },
      { status: 504 }
    );
  }
}
