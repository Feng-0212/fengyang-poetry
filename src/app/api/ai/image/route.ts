// ============================================================
// API: AI 诗词配图（两步：先生成绘画提示词，再据提示词生图）
// 兼容 OpenAI Images Generations（DALL·E / gpt-image-1 / 通义万相 等）
// Key 解析优先级：访客自带 Header > 站点环境变量
// 文本(提示词)与图像可分别配置 Provider：
//   文本：AI_API_KEY / AI_BASE_URL / AI_TEXT_MODEL
//   图像：AI_IMAGE_API_KEY / AI_IMAGE_BASE_URL / AI_IMAGE_MODEL（缺省回退到文本 Provider）
// ============================================================
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

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
  return { key, baseUrl, model };
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
      ? v.trim()
      : Array.isArray(v)
      ? v.map((p) => (typeof p === "string" ? p : p?.text || "")).join("").trim()
      : "";
  const raw: string =
    pick(msg.content) ||
    pick(msg.reasoning_content) ||
    pick(msg.reasoning) ||
    pick(msg?.provider_specific_fields?.reasoning) ||
    "";

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

export async function POST(req: Request) {
  const textCfg = resolveTextConfig(req);
  const imgCfg = resolveImageConfig(req);
  if (!imgCfg.key) {
    return NextResponse.json(
      { error: "未配置 API Key。请在「设置 · AI」中填入你自己的 Key，或联系站长配置。" },
      { status: 400 }
    );
  }

  let body: { title?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const { title = "", content = "" } = body;
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

  // 第二步：据提示词生图
  try {
    const resp = await fetch(`${imgCfg.baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${imgCfg.key}`,
      },
      body: JSON.stringify({
        model: imgCfg.model,
        prompt: promptEn,
        n: 1,
        size: "1024x1024",
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      return NextResponse.json(
        { error: `绘图调用失败 (${resp.status})`, detail: errText.slice(0, 300), promptEn, promptZh },
        { status: 502 }
      );
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
      return NextResponse.json(
        { error: "绘图返回为空", promptEn, promptZh },
        { status: 502 }
      );
    }
    return NextResponse.json({ image, promptEn, promptZh });
  } catch (e) {
    return NextResponse.json(
      { error: "网络错误：" + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
