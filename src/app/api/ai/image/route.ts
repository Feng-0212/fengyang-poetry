// ============================================================
// API: AI 诗词配图（两步：先生成绘画提示词，再据提示词生图）
// 增强：自动重试 + 备选模型 + 回退图池
// ============================================================
import { NextResponse } from "next/server";
import { createRateLimiter, retryAfterHeader } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 120;

// 指数退避延迟
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 文本 Provider（生成绘画提示词用）
function resolveTextConfig(req: Request) {
  const h = req.headers;
  const key =
    h.get("x-ai-key") || process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "";
  let baseUrl =
    h.get("x-ai-base-url") ||
    process.env.AI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.openai.com/v1";
  baseUrl = baseUrl.replace(/\/+$/, "");
  const model = h.get("x-ai-model") || process.env.AI_TEXT_MODEL || "gpt-4o-mini";
  return { key, baseUrl, model };
}

// 图像 Provider（据提示词生图用）
function resolveImageConfig(req: Request) {
  const h = req.headers;
  const key =
    h.get("x-ai-image-key") ||
    h.get("x-ai-key") ||
    process.env.AI_IMAGE_API_KEY ||
    process.env.AI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    "";
  let baseUrl =
    h.get("x-ai-image-base-url") ||
    h.get("x-ai-base-url") ||
    process.env.AI_IMAGE_BASE_URL ||
    process.env.AI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.openai.com/v1";
  baseUrl = baseUrl.replace(/\/+$/, "");
  const model =
    h.get("x-ai-image-model") || process.env.AI_IMAGE_MODEL || "dall-e-3";
  // 备选模型（环境变量 AI_IMAGE_MODEL_FALLBACK，逗号分隔）
  const fallbackModels = (process.env.AI_IMAGE_MODEL_FALLBACK || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return { key, baseUrl, model, fallbackModels };
}

// 第一步：调用文本模型，按固定模版生成绘画提示词（英文 + 中文）
async function buildDrawingPrompt(
  cfg: { key: string; baseUrl: string; model: string },
  title: string,
  content: string
): Promise<{ promptEn: string; promptZh: string }> {
  const poem = `${title ? "《" + title + "》 " : ""}${content}`;
  const instruction = `请帮我根据以下这首诗词生成AI绘画提示词：
【诗词内容】：${poem}
请严格按照以下要求生成英文提示词（附带中文翻译）：
核心画面：提取诗词中最具视觉张力的1-2个核心场景，明确人物的动作、服饰以及关键道具。
环境细节：根据诗词意境，补充光影、天气、植物、建筑材质等背景元素，烘托氛围。
艺术风格：采用新中式唯美插画风。
构图与画质：采用极简留白构图，要求8k分辨率，超高清细节，大师级杰作。
画面中不要出现任何文字、书法、印章或水印。

输出格式：只返回一个 JSON 对象，不要任何解释、前缀或 Markdown 代码块标记，格式为：
{"prompt_en": "<一段完整、可直接用于文生图的英文提示词>", "prompt_zh": "<对应的中文翻译>"}`;

  const resp = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.key}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        {
          role: "system",
          content:
            "你是一位精通 AI 绘画的提示词工程师，擅长把中国古典诗词转化为唯美的新中式插画提示词。只输出要求的 JSON。",
        },
        { role: "user", content: instruction },
      ],
      temperature: 0.8,
      max_tokens: 900,
      chat_template_kwargs: { enable_thinking: false },
    }),
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`提示词生成失败 (${resp.status}) ${t.slice(0, 200)}`);
  }
  const data = await resp.json();
  const msg = data?.choices?.[0]?.message || {};
  const pick = (v: unknown): string =>
    typeof v === "string"
      ? v
      : Array.isArray(v)
      ? v.map((p) => (typeof p === "string" ? p : p?.text || "")).join("")
      : "";
  const raw: string = pick(msg.content)
    .replace(/<tool_call>[\s\S]*?<\/think>/gi, "")
    .replace(/<tool_call>[\s\S]*/gi, "")
    .trim();

  // 解析 JSON（容忍代码块包裹）
  let promptEn = "";
  let promptZh = "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const obj = JSON.parse(jsonMatch[0]);
      promptEn = (obj.prompt_en || obj.promptEn || "").toString().trim();
      promptZh = (obj.prompt_zh || obj.promptZh || "").toString().trim();
    } catch {
      /* fall through */
    }
  }
  if (!promptEn) {
    // 兜底：整段文本作为英文提示词
    promptEn = raw.replace(/```[a-z]*|```/g, "").trim();
  }
  return { promptEn, promptZh };
}

// 回退图池（按节气/季节分类，实际项目用真实图片 URL）
const FALLBACK_IMAGES: Record<string, string[]> = {
  spring: [
    "/images/fallback/spring-1.jpg",
    "/images/fallback/spring-2.jpg",
    "/images/fallback/spring-3.jpg",
  ],
  summer: [
    "/images/fallback/summer-1.jpg",
    "/images/fallback/summer-2.jpg",
    "/images/fallback/summer-3.jpg",
  ],
  autumn: [
    "/images/fallback/autumn-1.jpg",
    "/images/fallback/autumn-2.jpg",
    "/images/fallback/autumn-3.jpg",
  ],
  winter: [
    "/images/fallback/winter-1.jpg",
    "/images/fallback/winter-2.jpg",
    "/images/fallback/winter-3.jpg",
  ],
  default: ["/images/fallback/default-1.jpg", "/images/fallback/default-2.jpg"],
};

// 根据季节选择回退图
function getFallbackImage(season?: string): string {
  const pool = FALLBACK_IMAGES[season || "default"] || FALLBACK_IMAGES.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

// 尝试调用图像生成 API（带重试）
async function generateImageWithRetry(
  cfg: { key: string; baseUrl: string; model: string; fallbackModels: string[] },
  promptEn: string,
  maxRetries = 3
): Promise<{ image: string; model: string; retries: number }> {
  const models = [cfg.model, ...cfg.fallbackModels];
  let lastError = "";

  for (const model of models) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // 指数退避：1s, 2s, 4s
          await sleep(1000 * Math.pow(2, attempt - 1));
        }

        const resp = await fetch(`${cfg.baseUrl}/images/generations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cfg.key}`,
          },
          body: JSON.stringify({
            model,
            prompt: promptEn,
            n: 1,
            size: "1024x1024",
          }),
        });

        if (!resp.ok) {
          const errText = await resp.text().catch(() => "");
          lastError = `(${resp.status}) ${errText.slice(0, 100)}`;
          // 503/429 重试，其他错误直接跳过该模型
          if (resp.status !== 503 && resp.status !== 429) break;
          continue;
        }

        const data = await resp.json();
        const item = data?.data?.[0];
        let image = "";
        if (item?.url) {
          image = item.url;
        } else if (item?.b64_json) {
          image = `data:image/png;base64,${item.b64_json}`;
        }
        if (!image) {
          lastError = "返回为空";
          continue;
        }

        return { image, model, retries: attempt };
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
      }
    }
  }

  throw new Error(lastError || "所有模型均失败");
}

// AI 生图：每 IP 每 60 秒最多 5 次（图片贵，限制更严）
const imageLimiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

export async function POST(req: Request) {
  const rl = await imageLimiter.check(req);
  if (!rl.success) {
    return new Response(null, {
      status: 429,
      headers: { "Retry-After": retryAfterHeader(rl.reset), "X-RateLimit-Limit": String(rl.total), "X-RateLimit-Remaining": String(rl.remaining) },
    });
  }
  const textCfg = resolveTextConfig(req);
  const imgCfg = resolveImageConfig(req);
  if (!imgCfg.key) {
    return NextResponse.json(
      { error: "未配置 API Key。请在「设置 · AI」中填入你自己的 Key，或联系站长配置。" },
      { status: 400 }
    );
  }

  let body: { title?: string; content?: string; season?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const { title = "", content = "", season } = body;
  if (!content.trim()) {
    return NextResponse.json({ error: "诗词内容为空" }, { status: 400 });
  }

  // 第一步：生成绘画提示词
  let promptEn = "";
  let promptZh = "";
  try {
    if (textCfg.key) {
      const r = await buildDrawingPrompt(textCfg, title, content);
      promptEn = r.promptEn;
      promptZh = r.promptZh;
    }
  } catch {
    /* 提示词生成失败则回退到简易提示词 */
  }
  if (!promptEn) {
    promptEn = `New Chinese-style aesthetic illustration inspired by the classical Chinese poem "${title}": ${content}. Minimalist composition with generous negative space, soft light and atmosphere, 8k, ultra-detailed, masterpiece. No text, no calligraphy, no seal, no watermark.`;
  }

  // 第二步：据提示词生图（带重试）
  try {
    const result = await generateImageWithRetry(imgCfg, promptEn, 3);
    return NextResponse.json({
      image: result.image,
      promptEn,
      promptZh,
      model: result.model,
      retries: result.retries,
    });
  } catch (e) {
    // 所有重试失败，返回回退图
    const fallback = getFallbackImage(season);
    console.error("[AI Image] All retries failed, using fallback:", e);
    return NextResponse.json({
      image: fallback,
      promptEn,
      promptZh,
      fallback: true,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
