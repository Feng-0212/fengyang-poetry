// ============================================================
// 墨韵阁 - 诗词接龙引擎（Phase 6）
// 规则：取上一句最后一个汉字，下一句须以该字开头
// ============================================================
import type { Poem } from "@/types/poem";

export interface ChainLine {
  text: string; // 句子文本（不含尾部标点）
  source: string; // 出处（诗题 · 作者）
}

const PUNCT = /[，。；！？、,.!?;:\s]/g;

/** 去除标点后取最后一个汉字 */
export function lastChar(line: string): string {
  const clean = line.replace(PUNCT, "");
  return clean.slice(-1);
}

/** 去除标点后取第一个汉字 */
export function firstChar(line: string): string {
  const clean = line.replace(PUNCT, "");
  return clean.slice(0, 1);
}

/** 清洗句子（去尾标点） */
export function cleanLine(line: string): string {
  return line.replace(/[，。；！？、,.!?;:\s]+$/g, "").trim();
}

/** 从诗词正文拆句 */
export function splitLines(content: string): string[] {
  return content
    .split(/[，。；！？、\n]/g)
    .map((l) => l.trim())
    .filter((l) => l.length >= 2);
}

/** 从用户诗库构建接龙句库 */
export function buildCorpusFromPoems(poems: Poem[]): ChainLine[] {
  const lines: ChainLine[] = [];
  for (const p of poems) {
    const source = `${p.title}${p.author && p.author !== "佚名" ? " · " + p.author : ""}`;
    for (const l of splitLines(p.content)) {
      lines.push({ text: cleanLine(l), source });
    }
  }
  return lines;
}

/** 经典名句库（内置，保证游戏可玩） */
export const CLASSIC_LINES: ChainLine[] = [
  { text: "床前明月光", source: "静夜思 · 李白" },
  { text: "疑是地上霜", source: "静夜思 · 李白" },
  { text: "举头望明月", source: "静夜思 · 李白" },
  { text: "低头思故乡", source: "静夜思 · 李白" },
  { text: "春眠不觉晓", source: "春晓 · 孟浩然" },
  { text: "处处闻啼鸟", source: "春晓 · 孟浩然" },
  { text: "夜来风雨声", source: "春晓 · 孟浩然" },
  { text: "花落知多少", source: "春晓 · 孟浩然" },
  { text: "白日依山尽", source: "登鹳雀楼 · 王之涣" },
  { text: "黄河入海流", source: "登鹳雀楼 · 王之涣" },
  { text: "欲穷千里目", source: "登鹳雀楼 · 王之涣" },
  { text: "更上一层楼", source: "登鹳雀楼 · 王之涣" },
  { text: "红豆生南国", source: "相思 · 王维" },
  { text: "春来发几枝", source: "相思 · 王维" },
  { text: "愿君多采撷", source: "相思 · 王维" },
  { text: "此物最相思", source: "相思 · 王维" },
  { text: "空山新雨后", source: "山居秋暝 · 王维" },
  { text: "天气晚来秋", source: "山居秋暝 · 王维" },
  { text: "明月松间照", source: "山居秋暝 · 王维" },
  { text: "清泉石上流", source: "山居秋暝 · 王维" },
  { text: "国破山河在", source: "春望 · 杜甫" },
  { text: "城春草木深", source: "春望 · 杜甫" },
  { text: "感时花溅泪", source: "春望 · 杜甫" },
  { text: "恨别鸟惊心", source: "春望 · 杜甫" },
  { text: "两个黄鹂鸣翠柳", source: "绝句 · 杜甫" },
  { text: "一行白鹭上青天", source: "绝句 · 杜甫" },
  { text: "窗含西岭千秋雪", source: "绝句 · 杜甫" },
  { text: "门泊东吴万里船", source: "绝句 · 杜甫" },
  { text: "千山鸟飞绝", source: "江雪 · 柳宗元" },
  { text: "万径人踪灭", source: "江雪 · 柳宗元" },
  { text: "孤舟蓑笠翁", source: "江雪 · 柳宗元" },
  { text: "独钓寒江雪", source: "江雪 · 柳宗元" },
  { text: "月落乌啼霜满天", source: "枫桥夜泊 · 张继" },
  { text: "江枫渔火对愁眠", source: "枫桥夜泊 · 张继" },
  { text: "姑苏城外寒山寺", source: "枫桥夜泊 · 张继" },
  { text: "夜半钟声到客船", source: "枫桥夜泊 · 张继" },
  { text: "远上寒山石径斜", source: "山行 · 杜牧" },
  { text: "白云深处有人家", source: "山行 · 杜牧" },
  { text: "停车坐爱枫林晚", source: "山行 · 杜牧" },
  { text: "霜叶红于二月花", source: "山行 · 杜牧" },
  { text: "绿蚁新醅酒", source: "问刘十九 · 白居易" },
  { text: "红泥小火炉", source: "问刘十九 · 白居易" },
  { text: "晚来天欲雪", source: "问刘十九 · 白居易" },
  { text: "能饮一杯无", source: "问刘十九 · 白居易" },
  { text: "海内存知己", source: "送杜少府之任蜀州 · 王勃" },
  { text: "天涯若比邻", source: "送杜少府之任蜀州 · 王勃" },
  { text: "会当凌绝顶", source: "望岳 · 杜甫" },
  { text: "一览众山小", source: "望岳 · 杜甫" },
  { text: "山重水复疑无路", source: "游山西村 · 陆游" },
  { text: "柳暗花明又一村", source: "游山西村 · 陆游" },
  { text: "问渠那得清如许", source: "观书有感 · 朱熹" },
  { text: "为有源头活水来", source: "观书有感 · 朱熹" },
];

/** 在句库中查找以 char 开头且不重复的候选句 */
export function findCandidates(
  corpus: ChainLine[],
  char: string,
  used: Set<string>,
  limit = 4
): ChainLine[] {
  if (!char) return [];
  const matches = corpus.filter(
    (l) => firstChar(l.text) === char && !used.has(l.text)
  );
  // 去重（相同文本只留一条）
  const seen = new Set<string>();
  const uniq: ChainLine[] = [];
  for (const m of matches) {
    if (!seen.has(m.text)) {
      seen.add(m.text);
      uniq.push(m);
    }
  }
  // 洗牌
  for (let i = uniq.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uniq[i], uniq[j]] = [uniq[j], uniq[i]];
  }
  return uniq.slice(0, limit);
}

/** 随机取一条起句 */
export function randomLine(corpus: ChainLine[]): ChainLine | null {
  if (corpus.length === 0) return null;
  return corpus[Math.floor(Math.random() * corpus.length)];
}
