// ============================================================
// API: AI 诗词赏析（OpenAI 兼容 Chat Completions）
// Key 解析优先级：访客自带 Header > 站点环境变量
// ============================================================
import { NextResponse } from "next/server";
import { cacheGet, cacheSet, hashKey } from "@/lib/kv";
import { createRateLimiter, retryAfterHeader } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;
const CACHE_TTL = 60 * 60 * 24 * 30; // 30 天

// 只取正文 content（兼容数组），并去除可能残留的 <think> 思考段；
// 绝不使用 reasoning 字段，避免把 AI 思考过程当结果显示。
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
  let text = pick(msg.content);
  // 去掉 <think>...</think> 或未闭合的 <think> 段
  text = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*/gi, "")
    .trim();
  return text;
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

// AI 赏析：每 IP 每 60 秒最多 10 次
const annotateLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

export async function POST(req: Request) {
  const rl = await annotateLimiter.check(req);
  if (!rl.success) {
    return new Response(null, {
      status: 429,
      headers: { "Retry-After": retryAfterHeader(rl.reset), "X-RateLimit-Limit": String(rl.total), "X-RateLimit-Remaining": String(rl.remaining) },
    });
  }
  const { key, baseUrl, model } = resolveConfig(req);
  if (!key) {
    return NextResponse.json(
      { error: "未配置 API Key。请在「设置 · AI」中填入你自己的 Key，或联系站长配置。" },
      { status: 400 }
    );
  }

  let body: {
    title?: string;
    author?: string;
    dynasty?: string;
    content?: string;
    refresh?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const { title = "", author = "", dynasty = "", content = "", refresh = false } = body;
  if (!content.trim()) {
    return NextResponse.json({ error: "诗词内容为空" }, { status: 400 });
  }

  // 仅当使用站点默认 Key（无访客个人 Key）时启用共享缓存，避免个人模型结果外泄
  const usePersonalKey = !!req.headers.get("x-ai-key");
  const cacheKey = `ai:annot:${hashKey(model, title, author, dynasty, content)}`;
  if (!usePersonalKey && !refresh) {
    const hit = await cacheGet<string>(cacheKey);
    if (hit && hit.trim()) {
      return NextResponse.json({ commentary: hit, cached: true });
    }
  }

  const prompt = `请你作为一位古典诗词鉴赏家，为下面这首诗词写一段赏析。

要求：
- 语言优美凝练，有文人气质，避免机械化的套话
- 内容包含：意象与意境、情感或主旨、艺术手法（如有）
- 篇幅约 150-250 字，一段成文，不要用小标题或列表
- 直接输出赏析正文，不要重复诗词原文，不要加「赏析：」等前缀

诗词信息：
标题：《${title || "无题"}》
${author ? `作者：${author}${dynasty ? "（" + dynasty + "）" : ""}\n` : ""}正文：
${content}`;

  const callModel = async () => {
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
            content:
              "你是一位学养深厚的古典诗词鉴赏家，文笔典雅，善于点出诗中意境与妙处。请直接输出赏析正文，不要输出任何思考过程。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 1200,
        chat_template_kwargs: { enable_thinking: false },
      }),
    });
    return resp;
  };

  try {
    let resp = await callModel();
    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      return NextResponse.json(
        { error: `模型调用失败 (${resp.status})`, detail: errText.slice(0, 300) },
        { status: 502 }
      );
    }
    let data = await resp.json();
    let text = extractText(data);

    // 若正文为空，自动重试一次
    if (!text) {
      resp = await callModel();
      if (resp.ok) {
        data = await resp.json();
        text = extractText(data);
      }
    }

    if (!text) {
      const snippet = JSON.stringify(data?.choices?.[0]?.message || {}).slice(0, 300);
      return NextResponse.json(
        { error: "模型返回为空，请重试", detail: snippet },
        { status: 502 }
      );
    }
    if (!usePersonalKey) {
      await cacheSet(cacheKey, text, CACHE_TTL);
    }
    return NextResponse.json({ commentary: text, cached: false });
  } catch (e) {
    return NextResponse.json(
      { error: "网络错误：" + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
