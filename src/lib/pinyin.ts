// ============================================================
// 拼音搜索工具
// ============================================================
import { pinyin } from "pinyin-pro";

// 缓存拼音结果（避免重复计算）
const pinyinCache = new Map<string, string>();

/**
 * 获取字符串的拼音（无空格，小写）
 * 例："静夜思" → "jingyesi"
 */
export function getPinyin(text: string): string {
  if (!text) return "";
  
  const cached = pinyinCache.get(text);
  if (cached) return cached;

  try {
    // 转换为拼音数组，去除声调
    const py = pinyin(text, {
      toneType: "none", // 无声调
      type: "array",    // 返回数组
    });
    
    const result = py.join("").toLowerCase();
    pinyinCache.set(text, result);
    return result;
  } catch {
    return text.toLowerCase();
  }
}

/**
 * 获取拼音首字母
 * 例："静夜思" → "jys"
 */
export function getPinyinInitials(text: string): string {
  if (!text) return "";
  
  try {
    const py = pinyin(text, {
      toneType: "none",
      type: "array",
      pattern: "first", // 首字母
    });
    
    return py.join("").toLowerCase();
  } catch {
    return text.toLowerCase();
  }
}

/**
 * 检查查询词是否匹配文本（支持拼音）
 * 匹配规则：
 * 1. 原文包含查询词
 * 2. 拼音包含查询词
 * 3. 拼音首字母包含查询词
 */
export function matchWithPinyin(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  
  if (!q) return true;
  
  // 1. 原文匹配
  if (t.includes(q)) return true;
  
  // 2. 拼音匹配
  const py = getPinyin(text);
  if (py.includes(q)) return true;
  
  // 3. 首字母匹配
  const initials = getPinyinInitials(text);
  if (initials.includes(q)) return true;
  
  return false;
}

/**
 * 计算拼音匹配得分（用于排序）
 */
export function pinyinMatchScore(text: string, query: string): number {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  
  if (!q) return 0;
  
  // 原文完全匹配 → 最高分
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.includes(q)) return 80;
  
  // 拼音完全匹配
  const py = getPinyin(text);
  if (py === q) return 70;
  if (py.startsWith(q)) return 60;
  if (py.includes(q)) return 50;
  
  // 首字母匹配
  const initials = getPinyinInitials(text);
  if (initials === q) return 40;
  if (initials.startsWith(q)) return 30;
  if (initials.includes(q)) return 20;
  
  return 0;
}
