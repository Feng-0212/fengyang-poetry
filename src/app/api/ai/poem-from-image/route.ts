// ============================================================
// API: 看图赋诗（POST /api/ai/poem-from-image）
// 用户上传图片 → 视觉模型读取画面 → 生成一首诗（题目+正文）
// 视觉模型走 OpenAI 兼容的多模态消息格式（image_url + text）
// 供应商链：访客 Header > AI_VISION_* 专用配置 > 站点 AI_* 配置
// 环境变量：
//   AI_VISION_KEY / AI_VISION_BASE_URL / AI_VISION_MODEL
//   未配置专用视觉配置时回退站点 AI_API_KEY + 默认视觉模型
// ============================================================
import { NextResponse } from "next/server";
import { createRateLimiter, retryAfterHeader } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const visionLimiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

const DEFAULT_VISION_BASE = "https://open.bigmodel.cn/api/paas/v4";
const DEFAULT_VISION_MODEL = "glm-4v-flash";

function cleanBase(url: string): string {
  return url.replace(/\/+$/, "");
}

interface VisionProvider {
  key: string;
  baseUrl: string;
  model: string;
}

/** 视觉供应商链：多级回退，逐个尝试 */
function getVisionChain(req: Request): VisionProvider[] {
  const h = req.headers;
  const visionModel =
    h.get("x-ai-vision-model") || process.env.AI_VISION_MODEL || DEFAULT_VISION_MODEL;
  const chain: VisionProvider[] = [];

  // ① 访客自带 Key（沿用其 base-url，若无则用视觉默认）
  const personalKey = h.get("x-ai-key");
  if (personalKey) {
    chain.push({
      key: personalKey,
      baseUrl: cleanBase(h.get("x-ai-base-url") || process.env.AI_BASE_URL || DEFAULT_VISION_BASE),
      model: visionModel,
    });
  }
  // ② 视觉专用配置
  const visionKey = process.env.AI_VISION_KEY;
  if (visionKey) {
    chain.push({
      key: visionKey,
      baseUrl: cleanBase(process.env.AI_VISION_BASE_URL || DEFAULT_VISION_BASE),
      model: visionModel,
    });
  }
  // ③ 站点通用配置 + 视觉模型名（中转站多半代理了视觉模型，值得一试）
  const siteKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  if (siteKey && !chain.some((p) => p.key === siteKey)) {
    chain.push({
      key: siteKey,
      baseUrl: cleanBase(
        process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL || DEFAULT_VISION_BASE
      ),
      model: visionModel,
    });
  }
  return chain;
}

function extractText(data: unknown): string {
  const msg = (data as { choices?: { message?: { content?: unknown } }[] })
    ?.choices?.[0]?.message;
  if (!msg) return "";
  const c = msg.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c))
    return c
      .map((p) => (typeof p === "string" ? p : (p as { text?: string })?.text || ""))
      .join("");
  return "";
}

export async function POST(req: Request) {
  const rl = await visionLimiter.check(req);
  if (!rl.success) {
    return new Response(null, {
      status: 429,
      headers: { "Retry-After": retryAfterHeader(rl.reset), "X-RateLimit-Limit": String(rl.total), "X-RateLimit-Remaining": String(rl.remaining) },
    });
  }

  const chain = getVisionChain(req);
  if (chain.length === 0) {
    return NextResponse.json(
      { error: "未配置视觉模型。请联系站长在环境变量中配置 AI_VISION_KEY（推荐免费注册智谱获取 glm-4v-flash 的 Key）。" },
      { status: 400 }
    );
  }

  let body: { image?: string; style?: "classical" | "modern" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const image = (body.image || "").trim();
  const style = body.style === "modern" ? "modern" : "classical";
  if (!/^data:image\/(png|jpe?g|webp|gif);base64,/.test(image)) {
    return NextResponse.json({ error: "请上传 PNG/JPG/WebP 格式的图片" }, { status: 400 });
  }
  // base64 体积上限约 5MB（原图约 3.7MB），超出直接拒绝
  if (image.length > 5_000_000) {
    return NextResponse.json({ error: "图片太大，请换一张小一些的图" }, { status: 400 });
  }

  const system =
    "你是一位既有画意又有诗心的诗人，擅长观画赋诗。只输出一个 JSON 对象，不要解释、不要 Markdown 代码块。";
  const styleText =
    style === "classical"
      ? "创作一首古典诗词（绝句、律诗或小令），讲究平仄语感、意象凝练、含蓄有味"
      : "创作一首现代诗，重意境与语言质感，分行自由";
  const prompt = `请仔细观察这张图片：画面中的景物、季节、时刻、色彩与情绪。

${styleText}。题目自拟（2-6 字），正文不超过 8 行。要求从画面出发但不拘泥于看图说话，要有想象与余韵。

只输出 JSON，格式：
{"title":"诗题","content":"诗文正文"}`;

  const content: unknown[] = [
    { type: "image_url", image_url: { url: image } },
    { type: "text", text: prompt },
  ];

  let lastStatus = 0;
  let lastDetail = "";
  let lastErr: unknown = null;
  for (const p of chain) {
    try {
      const resp = await fetch(`${p.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${p.key}`,
        },
        signal: AbortSignal.timeout(45_000),
        body: JSON.stringify({
          model: p.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content },
          ],
          temperature: 0.8,
          max_tokens: 600,
        }),
      });
      if (!resp.ok) {
        lastStatus = resp.status;
        lastDetail = (await resp.text().catch(() => "")).slice(0, 300);
        continue;
      }
      const data = await resp.json();
      const raw = extractText(data)
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/```[a-z]*|```/g, "")
        .trim();
      let title = "";
      let poem = "";
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          const obj = JSON.parse(m[0]);
          title = (obj.title || obj.Title || "").toString().trim();
          poem = (obj.content || obj.poem || obj.Content || "").toString().trim();
        } catch {
          /* 落入兜底 */
        }
      }
      if (!poem) {
        // 兜底：首行当题目，其余当正文
        const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length >= 2) {
          title = title || lines[0].replace(/^《|》$/g, "");
          poem = lines.slice(1).join("\n");
        } else {
          poem = raw;
        }
      }
      if (!poem) {
        lastStatus = 0;
        lastDetail = "模型返回为空";
        continue;
      }
      return NextResponse.json({ title, content: poem, model: p.model });
    } catch (e) {
      lastErr = e;
    }
  }

  if (lastStatus) {
    return NextResponse.json(
      { error: `视觉模型调用失败 (${lastStatus})`, detail: lastDetail },
      { status: 502 }
    );
  }
  return NextResponse.json(
    { error: "网络错误：" + (lastErr instanceof Error ? lastErr.message : String(lastErr)) },
    { status: 500 }
  );
}
