// ============================================================
// API: 语义搜索（基于 AI 文本模型）
// 输入自然语言查询，返回相关诗词 ID 列表
// ============================================================
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { cacheGet, cacheSet, hashKey } from "@/lib/kv";
import { createRateLimiter, retryAfterHeader } from "@/lib/ratelimit";

const redis = Redis.fromEnv();

export const runtime = "nodejs";
export const maxDuration = 30;
const CACHE_TTL = 60 * 60 * 24 * 7; // 7 天

function resolveConfig(req: Request) {
  const h = req.headers;
  const key =
    h.get("x-ai-key") ||
    process.env.AI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    "";
  let baseUrl =
    h.get("x-ai-base-url") ||
    process.env.AI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.openai.com/v1";
  baseUrl = baseUrl.replace(/\/+$/, "");
  const model =
    h.get("x-ai-model") ||
    process.env.AI_TEXT_MODEL ||
    "gpt-4o-mini";
  return { key, baseUrl, model };
}

function extractText(data: unknown): string {
  const msg = (data as { choices?: { message?: Record<string, unknown> }[] })
    ?.choices?.[0]?.message;
  if (!msg) return "";
  const pick = (v: unknown): string => {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (Array.isArray(v))
      return v
        .map((p) =>
          typeof p === "string" ? p : (p as { text?: string })?.text || ""
        )
        .join("");
    return "";
  };
  return pick(msg.content)
    .replace(/<tool_call>[\s\S]*?<\/think>/gi, "")
    .replace(/<tool_call>[\s\S]*/gi, "")
    .trim();
}

// AI 语义搜索：每 IP 每 60 秒最多 10 次
const searchLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

export async function POST(req: Request) {
  const rl = await searchLimiter.check(req);
  if (!rl.success) {
    return new Response(null, {
      status: 429,
      headers: { "Retry-After": retryAfterHeader(rl.reset), "X-RateLimit-Limit": String(rl.total), "X-RateLimit-Remaining": String(rl.remaining) },
    });
  }
  const { key, baseUrl, model } = resolveConfig(req);
  if (!key) {
    return NextResponse.json(
      { error: "未配置 API Key。请在「设置 · AI」中填入你自己的 Key。" },
      { status: 400 }
    );
  }

  let body: { query?: string; limit?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const { query = "", limit = 10 } = body;
  if (!query.trim()) {
    return NextResponse.json({ error: "查询词为空" }, { status: 400 });
  }

  // 检查缓存
  const usePersonalKey = !!req.headers.get("x-ai-key");
  const cacheKey = `ai:semantic:${hashKey(model + query + limit)}`;
  if (!usePersonalKey) {
    const hit = await cacheGet<string>(cacheKey);
    if (hit) {
      try {
        const cached = JSON.parse(hit);
        return NextResponse.json({ ...cached, cached: true });
      } catch {}
    }
  }

  // 获取所有诗词（直接从 Redis）
  let poems: Array<{ id: string; title: string; author?: string; content: string; tags?: string[] }> = [];
  try {
    const poemsData = await redis.get<{ id: string; title: string; author?: string; content: string; tags?: string[]; deletedAt?: string }[]>("poems:all");
    if (poemsData && Array.isArray(poemsData)) {
      poems = poemsData
        .filter((p) => !p.deletedAt)
        .slice(0, 100)
        .map((p) => ({
          id: p.id,
          title: p.title,
          author: p.author || "佚名",
          content: p.content.slice(0, 100),
          tags: p.tags || [],
        }));
    }
  } catch (err) {
    console.error("[AI Search] Failed to fetch poems:", err);
  }

  if (poems.length === 0) {
    return NextResponse.json(
      { error: "暂无诗词数据，请先添加诗词" },
      { status: 400 }
    );
  }

  const poemList = poems;

  const prompt = `你是一位古典诗词专家。用户用自然语言描述想要找的诗词，请从给定的诗词列表中选出最相关的 ${limit} 首。

用户查询：${query}

诗词列表：
${JSON.stringify(poemList, null, 2)}

要求：
1. 理解用户的查询意图（可能是主题、情感、意象、风格等）
2. 从列表中选出最相关的诗词（最多 ${limit} 首）
3. 返回 JSON 格式：{"results":[{"id":"诗词ID","reason":"简短理由（10字内）"}]}
4. 如果没有相关诗词，返回 {"results":[]}
5. 直接输出 JSON，不要有任何解释`;

  try {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "你是古典诗词专家，擅长理解用户的查询意图并推荐相关诗词。只输出 JSON。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        chat_template_kwargs: { enable_thinking: false },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      return NextResponse.json(
        { error: `模型调用失败 (${resp.status})`, detail: errText.slice(0, 200) },
        { status: 502 }
      );
    }

    const data = await resp.json();
    const raw = extractText(data);

    // 解析 JSON
    let results: Array<{ id: string; reason?: string }> = [];
    try {
      const cleaned = raw.replace(/^[^{[]*/, "").replace(/[^}\]]*$/, "");
      const parsed = JSON.parse(cleaned);
      results = parsed.results || [];
    } catch {
      // fallback：尝试从文本中提取 ID
      const idMatches = raw.match(/"id"\s*:\s*"[^"]+"/g);
      if (idMatches) {
        results = idMatches.map((m) => {
          const id = m.match(/"([^"]+)"/)?.[1] || "";
          return { id };
        });
      }
    }

    // 验证 ID 有效性
    const validIds = new Set(poems.map((p) => p.id));
    results = results.filter((r) => validIds.has(r.id)).slice(0, limit);

    const response = { results, query };

    if (!usePersonalKey) {
      await cacheSet(cacheKey, JSON.stringify(response), CACHE_TTL);
    }

    return NextResponse.json(response);
  } catch (e) {
    return NextResponse.json(
      { error: "网络错误：" + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
