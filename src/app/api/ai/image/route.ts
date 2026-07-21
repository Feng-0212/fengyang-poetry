// ============================================================
// API: AI 诗词配图（OpenAI 兼容 Images Generations）
// 兼容 DALL·E / gpt-image-1 / 通义万相等 OpenAI 兼容接口
// Key 解析优先级：访客自带 Header > 站点环境变量
// ============================================================
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

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
    h.get("x-ai-image-model") ||
    process.env.AI_IMAGE_MODEL ||
    "dall-e-3";
  return { key, baseUrl, model };
}

export async function POST(req: Request) {
  const { key, baseUrl, model } = resolveConfig(req);
  if (!key) {
    return NextResponse.json(
      { error: "未配置 API Key。请在「设置 · AI」中填入你自己的 Key，或联系站长配置。" },
      { status: 400 }
    );
  }

  let body: {
    title?: string;
    content?: string;
    solarTerm?: string;
    season?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const { title = "", content = "" } = body;
  if (!content.trim()) {
    return NextResponse.json({ error: "诗词内容为空" }, { status: 400 });
  }

  // 根据诗意生成中国水墨/工笔风格提示词
  const prompt = `中国传统水墨画风格的诗意插图，意境优美，留白得当，仅描绘自然景物与意象，画面中不要出现任何文字。根据以下诗词的意境作画：《${title}》 ${content}`;

  try {
    const resp = await fetch(`${baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size: "1024x1024",
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      return NextResponse.json(
        { error: `绘图调用失败 (${resp.status})`, detail: errText.slice(0, 300) },
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
      return NextResponse.json({ error: "绘图返回为空" }, { status: 502 });
    }
    return NextResponse.json({ image });
  } catch (e) {
    return NextResponse.json(
      { error: "网络错误：" + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
