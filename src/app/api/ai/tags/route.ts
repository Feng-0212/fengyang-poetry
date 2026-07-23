// ============================================================
// API: AI 标签建议（POST /api/ai/tags）
// 复用已有 AI 模型，按诗词内容推荐 2-3 个标签
// ============================================================
import { NextResponse } from "next/server";
import type { Poem } from "@/types/poem";
import { createRateLimiter, retryAfterHeader } from "@/lib/ratelimit";

// 预定义标签池（与 TagInput SUGGESTED 保持一致，可扩展）
const TAG_POOL = [
  "思乡", "山水", "豪放", "婉约", "田园", "边塞",
  "咏物", "送别", "怀古", "闺怨", "禅意", "爱情",
  "羁旅", "隐逸", "闲适", "离愁", "壮志", "悲秋",
];

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
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*/gi, "")
    .trim();
}

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

// 简单的 JSON parse — 只取前3个 tag
function parseTags(raw: string): string[] {
  try {
    const cleaned = raw
      .replace(/^[^{[]*/, "")
      .replace(/[^}\]]*$/, "");
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed.slice(0, 3).filter(Boolean);
    if (parsed.tags && Array.isArray(parsed.tags)) return parsed.tags.slice(0, 3).filter(Boolean);
  } catch {}
  // fallback：纯文本逗号分隔
  return raw
    .split(/[,，、\n]/)
    .map((t) => t.trim().replace(/^#+/, ""))
    .filter((t) => t.length > 0 && t.length <= 6)
    .slice(0, 3);
}

// AI 标签：每 IP 每 60 秒最多 15 次
const tagsLimiter = createRateLimiter({ limit: 15, windowMs: 60_000 });

export async function POST(req: Request) {
  const rl = await tagsLimiter.check(req);
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

  let body: {
    title?: string;
    author?: string;
    content?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const { title = "", author = "", content = "" } = body;
  if (!content.trim()) {
    return NextResponse.json({ error: "诗词内容为空" }, { status: 400 });
  }

  const prompt = `你是一位古典诗词鉴赏家。请根据下面这首诗词，从标签池中推荐 2-3 个最贴切的标签。

标签池：${TAG_POOL.join("、")}
要求：从标签池中选，不在池中但高度相关的标签也可补充。总共不超过 3 个。

直接输出 JSON 格式，不要有任何解释：
{"tags":["标签1","标签2","标签3"]}

诗词信息：
${title ? `标题：《${title}》\n` : ""}${author ? `作者：${author}\n` : ""}正文：
${content}`;

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
            content: "你是古典诗词专家，直接输出 JSON，不要任何额外文字。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 150,
        chat_template_kwargs: { enable_thinking: false },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      return NextResponse.json(
        { error: `模型调用失败 (${resp.status})`, detail: errText.slice(0, 300) },
        { status: 502 }
      );
    }

    const data = await resp.json();
    const raw = extractText(data);
    const tags = parseTags(raw);

    if (tags.length === 0) {
      return NextResponse.json({ error: "未能提取标签，请重试" }, { status: 502 });
    }

    return NextResponse.json({ tags });
  } catch (e) {
    return NextResponse.json(
      { error: "网络错误：" + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
