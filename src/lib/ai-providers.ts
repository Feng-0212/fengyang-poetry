// ============================================================
// AI 供应商链：主配置（访客 Key → 站点环境变量）失败时自动降级
// 到 DeepSeek（DEEPSEEK_API_KEY），避免单一上游故障导致全站 AI 不可用
// 所有 OpenAI 兼容的 chat/completions 调用统一走 fetchChat
// 另含全站 AI 每日熔断：仅统计用站点 Key 的调用，访客自带 Key 不限
// ============================================================
import { getKv } from "./kv";

export const AI_DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT || "500", 10);

export interface AIProvider {
  key: string;
  baseUrl: string;
  model: string;
  label: string;
}

function cleanBase(url: string): string {
  return url.replace(/\/+$/, "");
}

/** 主配置：访客自带 Key 优先，其次站点环境变量 */
function primaryProvider(req: Request): AIProvider | null {
  const h = req.headers;
  const key = h.get("x-ai-key") || process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "";
  if (!key) return null;
  const baseUrl = cleanBase(
    h.get("x-ai-base-url") ||
      process.env.AI_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      "https://api.openai.com/v1"
  );
  const model = h.get("x-ai-model") || process.env.AI_TEXT_MODEL || "gpt-4o-mini";
  return { key, baseUrl, model, label: h.get("x-ai-key") ? "personal" : "primary" };
}

/** 降级配置：DeepSeek（OpenAI 兼容），未配置则不启用 */
function deepseekProvider(): AIProvider | null {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  return {
    key,
    baseUrl: cleanBase(process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"),
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    label: "deepseek",
  };
}

/** 完整供应商链：主配置在前，DeepSeek 兜底（与主配置相同则去重） */
export function getProviderChain(req: Request): AIProvider[] {
  const chain: AIProvider[] = [];
  const p = primaryProvider(req);
  if (p) chain.push(p);
  const d = deepseekProvider();
  if (d && !chain.some((x) => x.key === d.key && x.baseUrl === d.baseUrl)) {
    chain.push(d);
  }
  return chain;
}

export function hasAnyKey(req: Request): boolean {
  return getProviderChain(req).length > 0;
}

/** 主模型名（仅用于缓存键区分，实际调用以链内各 provider 的 model 为准） */
export function getPrimaryModel(req: Request): string {
  return primaryProvider(req)?.model || "deepseek-chat";
}

/* 只透传标准字段：chat_template_kwargs 等厂商私有参数会被部分网关拒绝，统一剥除 */
const PASS_FIELDS = [
  "messages",
  "temperature",
  "max_tokens",
  "top_p",
  "response_format",
  "presence_penalty",
  "frequency_penalty",
  "stop",
] as const;

export type ChatBody = Partial<Record<(typeof PASS_FIELDS)[number], unknown>> & {
  messages: unknown;
};

/**
 * 按供应商链依次调用 chat/completions：
 * 任一家成功（2xx）即返回其 Response；全部失败时返回最后一次的 Response
 * （网络层全挂则抛出最后一次异常）。4xx 同样降级——用户 Key 配错时
 * 自动用站点配置兜底，错误信息只在全部供应商都失败后暴露。
 */
export async function fetchChat(
  req: Request,
  body: ChatBody,
  timeoutMs = 60_000
): Promise<Response> {
  const chain = getProviderChain(req);
  if (chain.length === 0) {
    throw new Error("NO_KEY");
  }
  let lastResp: Response | null = null;
  let lastErr: unknown = null;
  for (const p of chain) {
    const payload: Record<string, unknown> = { model: p.model };
    for (const f of PASS_FIELDS) {
      if (body[f] !== undefined) payload[f] = body[f];
    }
    try {
      const resp = await fetch(`${p.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${p.key}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (resp.ok) return resp;
      lastResp = resp;
    } catch (e) {
      lastErr = e;
    }
  }
  if (lastResp) return lastResp;
  throw lastErr ?? new Error("ALL_PROVIDERS_FAILED");
}

export const NO_KEY_MESSAGE =
  "未配置 API Key。请在「设置 · AI」中填入你自己的 Key，或联系站长配置。";

/**
 * 全站 AI 每日熔断：仅统计用站点 Key 的调用（访客自带 Key 直接放行）。
 * 返回 null 表示放行；返回字符串为超限提示文案（路由转 429 返回）。
 * 放在路由的缓存命中检查之后、真正发起模型调用之前，缓存命中不计费。
 */
export async function aiQuotaGuard(req: Request): Promise<string | null> {
  if (req.headers.get("x-ai-key")) return null; // BYOK 不占站点额度
  const kv = await getKv();
  if (!kv) return null; // 无 Redis 时降级放行（与限流同策略）
  try {
    const day = new Date().toISOString().slice(0, 10);
    const key = `ai:global:daily:${day}`;
    const n = await kv.incr(key);
    if (n === 1) await kv.expire(key, 60 * 60 * 48);
    if (n > AI_DAILY_LIMIT) {
      return `今日 AI 体验额度已用完（每天 ${AI_DAILY_LIMIT} 次），明天再来吧；或在「设置 · AI」填入自己的 Key 畅快使用`;
    }
  } catch {
    /* 计数失败不拦截 */
  }
  return null;
}
