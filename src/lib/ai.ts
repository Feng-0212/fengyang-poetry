// ============================================================
// 墨韵阁 - AI 能力客户端（赏析 / 配图）
// 访客可在设置中填入自己的 API 配置，存 localStorage；
// 留空则使用站点默认（站长配置的环境变量）。
// ============================================================
import type { Poem } from "@/types/poem";

const AI_CONFIG_KEY = "moyun_ai_config";

export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  textModel: string;
  imageModel: string;
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  apiKey: "",
  baseUrl: "",
  textModel: "",
  imageModel: "",
};

export function getAiConfig(): AiConfig {
  if (typeof window === "undefined") return DEFAULT_AI_CONFIG;
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    if (!raw) return DEFAULT_AI_CONFIG;
    return { ...DEFAULT_AI_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export function saveAiConfig(cfg: AiConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(cfg));
}

export function clearAiConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AI_CONFIG_KEY);
}

/** 是否已配置个人 Key */
export function hasPersonalKey(): boolean {
  return !!getAiConfig().apiKey.trim();
}

function buildHeaders(kind: "text" | "image"): Record<string, string> {
  const cfg = getAiConfig();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (cfg.apiKey.trim()) h["x-ai-key"] = cfg.apiKey.trim();
  if (cfg.baseUrl.trim()) h["x-ai-base-url"] = cfg.baseUrl.trim();
  // 文本模型：赏析与「图像提示词生成」都会用到
  if (cfg.textModel.trim()) h["x-ai-model"] = cfg.textModel.trim();
  if (kind === "image" && cfg.imageModel.trim())
    h["x-ai-image-model"] = cfg.imageModel.trim();
  return h;
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data?.error || `请求失败 (${res.status})`;
  } catch {
    return `请求失败 (${res.status})`;
  }
}

/** 生成 AI 赏析 */
export async function generateCommentary(poem: Poem): Promise<string> {
  const res = await fetch("/api/ai/annotate", {
    method: "POST",
    headers: buildHeaders("text"),
    body: JSON.stringify({
      title: poem.title,
      author: poem.author,
      dynasty: poem.dynasty,
      content: poem.content,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return data.commentary as string;
}

export interface ImageResult {
  image: string;
  promptEn?: string;
  promptZh?: string;
}

/** 生成 AI 配图：先生成绘画提示词，再据提示词生图 */
export async function generateImage(poem: Poem): Promise<ImageResult> {
  const res = await fetch("/api/ai/image", {
    method: "POST",
    headers: buildHeaders("image"),
    body: JSON.stringify({
      title: poem.title,
      content: poem.content,
      solarTerm: poem.solarTerm,
      season: poem.season,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return {
    image: data.image as string,
    promptEn: data.promptEn as string | undefined,
    promptZh: data.promptZh as string | undefined,
  };
}
