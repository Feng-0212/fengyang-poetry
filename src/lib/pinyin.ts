// ============================================================
// 拼音搜索工具（pinyin-pro 动态加载，避免首屏体积过大）
// ============================================================

// 动态加载：pinyin-pro 仅在实际需要时才加载，不进入首屏 bundle
type PinyinFn = (text: string, options?: any) => string[];
let pinyinFn: PinyinFn | null = null;
let pinyinPromise: Promise<boolean> | null = null;

/** 预加载拼音库（在搜索页 mount 时调用，不阻塞首屏） */
export function ensurePinyin(): Promise<boolean> {
  if (pinyinFn) return Promise.resolve(true);
  if (!pinyinPromise) {
    pinyinPromise = import("pinyin-pro")
      .then((m) => {
        pinyinFn = m.pinyin as PinyinFn;
        return true;
      })
      .catch((err) => {
        console.error("[pinyin] 加载失败，拼音搜索降级为文本搜索", err);
        return false;
      });
  }
  return pinyinPromise;
}

// 缓存拼音结果（避免重复计算）
const pinyinCache = new Map<string, string>();

/**
 * 获取字符串的拼音（无空格，小写）
 * 例："静夜思" → "jingyesi"
 * 注意：拼音库未加载时返回原文本小写（降级），不写入缓存
 */
export function getPinyin(text: string): string {
  if (!text) return "";

  const cached = pinyinCache.get(text);
  if (cached) return cached;

  // 库未加载：降级为原始文本小写，不缓存（等加载完成后下次计算正确结果）
  if (!pinyinFn) return text.toLowerCase();

  try {
    const py = pinyinFn(text, {
      toneType: "none", // 无声调
      type: "array", // 返回数组
    });
    const result = py.join("").toLowerCase();
    pinyinCache.set(text, result);
    return result;
  } catch {
    const fallback = text.toLowerCase();
    pinyinCache.set(text, fallback);
    return fallback;
  }
}

/**
 * 获取拼音首字母
 * 例："静夜思" → "jys"
 * 库未加载时返回空字符串（降级，不影响文本搜索）
 */
export function getPinyinInitials(text: string): string {
  if (!text || !pinyinFn) return "";

  try {
    const py = pinyinFn(text, {
      toneType: "none",
      type: "array",
      pattern: "first", // 首字母
    });
    return py.join("").toLowerCase();
  } catch {
    return "";
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
