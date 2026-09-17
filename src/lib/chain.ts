// ============================================================
// 墨韵阁 - 飞花令引擎
// 规则：定一字为「令」，轮流吟出含令字的诗句；
//       每句须真实存在于诗藏词库（经 /api/shicang/verify 验证），
//       整局不得重复，接不上者为负
// ============================================================

export interface FlowerHit {
  id: number | null;
  title: string;
  poet: string;
  dynasty: string | null;
  line: string;
  url: string | null; // 词库命中时为诗藏页面链接；AI 考证时为 null
  via?: "ai"; // ai = DeepSeek 兜底考证
  note?: string | null;
}

/** 验证失败原因（前端文案用） */
export type VerifyReason =
  | "empty"
  | "too_short"
  | "too_long"
  | "char_missing"
  | "duplicate"
  | "not_found"
  | "rate_limited"
  | "upstream_error"
  | "upstream_unreachable";

/** 经典飞花令字（花月风云等，见Custom） */
export const FLOWER_CHARS = [
  "花", "月", "风", "雪", "春", "江",
  "山", "云", "酒", "夜", "舟", "马",
];

const PUNCT = /[，。；！？、·…—－“”‘’：\s,.!?;:'"()（）〔〕《》〈〉\[\]{}<>-]/g;

/** 去掉标点与空白，只留文字（用于提交与查重） */
export function normalizeLine(s: string): string {
  return s.replace(PUNCT, "").trim();
}

/** 客户端预校验，返回 null 表示可提交 */
export function precheck(line: string, char: string): VerifyReason | null {
  if (!line) return "empty";
  const n = [...line].length;
  if (n < 3) return "too_short";
  if (n > 40) return "too_long";
  if (char && !line.includes(char)) return "char_missing";
  return null;
}

/** 随机取一个令字 */
export function randomFlowerChar(exclude: string[] = []): string {
  const pool = FLOWER_CHARS.filter((c) => !exclude.includes(c));
  const src = pool.length ? pool : FLOWER_CHARS;
  return src[Math.floor(Math.random() * src.length)];
}
