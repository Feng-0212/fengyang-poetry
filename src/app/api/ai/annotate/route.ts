// ============================================================
// API: AI 诗词赏析（OpenAI 兼容 Chat Completions）
// Key 解析优先级：访客自带 Header > 站点环境变量
// ============================================================
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

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
    author?: string;
    dynasty?: string;
    content?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const { title = "", author = "", dynasty = "", content = "" } = body;
  if (!content.trim()) {
    return NextResponse.json({ error: "诗词内容为空" }, { status: 400 });
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
            content:
              "你是一位学养深厚的古典诗词鉴赏家，文笔典雅，善于点出诗中意境与妙处。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 800,
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
    const text: string =
      data?.choices?.[0]?.message?.content?.trim() || "";
    if (!text) {
      return NextResponse.json({ error: "模型返回为空" }, { status: 502 });
    }
    return NextResponse.json({ commentary: text });
  } catch (e) {
    return NextResponse.json(
      { error: "网络错误：" + (e instanceof Error ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
