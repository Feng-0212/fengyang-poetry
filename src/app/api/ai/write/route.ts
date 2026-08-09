// ============================================================
// API: AI 续写 / 仿写（OpenAI 兼容 Chat Completions）
// - mode=continue：给未完成的诗词续写后续句
// - mode=parody：按给定主题/风格仿写一首新诗
// Key 解析优先级：访客自带 Header > 站点环境变量
// ============================================================
import { NextResponse } from "next/server";
import { createRateLimiter, retryAfterHeader } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

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

const writeLimiter = createRateLimiter({ limit: 8, windowMs: 60_000 });

export async function POST(req: Request) {
  const rl = await writeLimiter.check(req);
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
    mode?: "continue" | "parody";
    title?: string;
    content?: string;
    author?: string;
    dynasty?: string;
    style?: string; // 仿写风格（如：李白豪放、王维山水）
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const mode = body.mode === "parody" ? "parody" : "continue";
  const { title = "", content = "", author = "", dynasty = "", style = "" } = body;

  if (mode === "continue" && !content.trim()) {
    return NextResponse.json({ error: "请先输入已有诗句，再进行续写" }, { status: 400 });
  }
  if (mode === "parody" && !title.trim() && !content.trim() && !style.trim()) {
    return NextResponse.json({ error: "请提供主题、原文或风格之一" }, { status: 400 });
  }

  const system =
    mode === "continue"
      ? "你是一位深谙古典诗词格律的诗人。请根据用户给出的已写诗句，自然地续写完整。保持原诗的句式、韵脚与意境风格；若原诗为现代诗则延续其风格。直接输出续写内容，不要解释，不要输出思考过程。"
      : "你是一位古典诗词大家。请根据用户指定的主题或参考风格，创作一首完整的新诗。旧体诗应讲究平仄押韵、意象凝练；现代诗则重意境与语言质感。直接输出整首诗，不要解释，不要输出思考过程。";

  let prompt: string;
  if (mode === "continue") {
    prompt = `以下是已写的诗句（可能不完整）：\n${content}\n\n请续写后面的内容，与上文衔接自然。`;
  } else {
    const parts: string[] = [];
    if (title) parts.push(`题目/主题：《${title}》`);
    if (style) parts.push(`风格要求：${style}`);
    if (author) parts.push(`可参考：${author}${dynasty ? `（${dynasty}）` : ""}的笔法`);
    if (content) parts.push(`参考原作：\n${content}`);
    prompt = `请创作一首新诗。\n${parts.join("\n")}\n\n要求：独立成篇，不照抄参考原作，但可融入其意境。`;
  }

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
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature: 0.85,
        max_tokens: 800,
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
    if (!text) {
      resp = await callModel();
      if (resp.ok) {
        data = await resp.json();
        text = extractText(data);
      }
    }
    if (!text) {
      return NextResponse.json({ error: "模型返回为空，请重试" }, { status: 502 });
    }
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json(
      { error: "网络错误：" + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
