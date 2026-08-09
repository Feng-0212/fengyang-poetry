// ============================================================
// 经典诗词库（公版作品，一键导入用）
// 精选经典唐诗宋词，覆盖四季，便于新用户快速填充诗库。
// 均为公有领域作品，无版权问题。
// ============================================================
import type { Poem } from "@/types/poem";

export interface ClassicPoem {
  title: string;
  author: string;
  dynasty: string;
  content: string;
  season: "spring" | "summer" | "autumn" | "winter" | "";
  tags: string[];
}

/** 各季节默认节气（用于无明确节气的诗，key 为 SolarTermKey） */
const SEASON_TERM: Record<Exclude<ClassicPoem["season"], "">, string> = {
  spring: "chunfen",
  summer: "xiazhi",
  autumn: "qiufen",
  winter: "dongzhi",
};

/** 由 season 推导默认节气 key（空季返回立春兜底） */
export function seasonToTerm(season: ClassicPoem["season"]): string {
  return season ? SEASON_TERM[season] : "lichun";
}

export const CLASSIC_POEMS: ClassicPoem[] = [
  {
    title: "静夜思",
    author: "李白",
    dynasty: "唐",
    content: "床前明月光，疑是地上霜。\n举头望明月，低头思故乡。",
    season: "autumn",
    tags: ["思乡", "月亮", "羁旅"],
  },
  {
    title: "春晓",
    author: "孟浩然",
    dynasty: "唐",
    content: "春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。",
    season: "spring",
    tags: ["春日", "惜春", "田园"],
  },
  {
    title: "登鹳雀楼",
    author: "王之涣",
    dynasty: "唐",
    content: "白日依山尽，黄河入海流。\n欲穷千里目，更上一层楼。",
    season: "",
    tags: ["哲理", "登高", "壮阔"],
  },
  {
    title: "江雪",
    author: "柳宗元",
    dynasty: "唐",
    content: "千山鸟飞绝，万径人踪灭。\n孤舟蓑笠翁，独钓寒江雪。",
    season: "winter",
    tags: ["冬日", "孤寂", "山水"],
  },
  {
    title: "悯农",
    author: "李绅",
    dynasty: "唐",
    content: "锄禾日当午，汗滴禾下土。\n谁知盘中餐，粒粒皆辛苦。",
    season: "summer",
    tags: ["劳作", "悯农", "劝诫"],
  },
  {
    title: "望庐山瀑布",
    author: "李白",
    dynasty: "唐",
    content: "日照香炉生紫烟，遥看瀑布挂前川。\n飞流直下三千尺，疑是银河落九天。",
    season: "summer",
    tags: ["山水", "瀑布", "豪放"],
  },
  {
    title: "绝句",
    author: "杜甫",
    dynasty: "唐",
    content: "两个黄鹂鸣翠柳，一行白鹭上青天。\n窗含西岭千秋雪，门泊东吴万里船。",
    season: "spring",
    tags: ["春日", "画面", "工对"],
  },
  {
    title: "九月九日忆山东兄弟",
    author: "王维",
    dynasty: "唐",
    content: "独在异乡为异客，每逢佳节倍思亲。\n遥知兄弟登高处，遍插茱萸少一人。",
    season: "autumn",
    tags: ["重阳", "思亲", "羁旅"],
  },
  {
    title: "枫桥夜泊",
    author: "张继",
    dynasty: "唐",
    content: "月落乌啼霜满天，江枫渔火对愁眠。\n姑苏城外寒山寺，夜半钟声到客船。",
    season: "autumn",
    tags: ["秋夜", "羁旅", "愁绪"],
  },
  {
    title: "咏柳",
    author: "贺知章",
    dynasty: "唐",
    content: "碧玉妆成一树高，万条垂下绿丝绦。\n不知细叶谁裁出，二月春风似剪刀。",
    season: "spring",
    tags: ["春日", "咏物", "巧思"],
  },
  {
    title: "相思",
    author: "王维",
    dynasty: "唐",
    content: "红豆生南国，春来发几枝。\n愿君多采撷，此物最相思。",
    season: "spring",
    tags: ["相思", "红豆", "爱情"],
  },
  {
    title: "水调歌头·明月几时有",
    author: "苏轼",
    dynasty: "宋",
    content:
      "明月几时有？把酒问青天。\n不知天上宫阙，今夕是何年。\n我欲乘风归去，又恐琼楼玉宇，高处不胜寒。\n起舞弄清影，何似在人间。\n转朱阁，低绮户，照无眠。\n不应有恨，何事长向别时圆？\n人有悲欢离合，月有阴晴圆缺，此事古难全。\n但愿人长久，千里共婵娟。",
    season: "autumn",
    tags: ["中秋", "月亮", "旷达", "哲理"],
  },
];

/** 依据标题查重：返回已存在的标题集合 */
export function classicExists(existing: Poem[]): Set<string> {
  return new Set(existing.map((p) => p.title));
}
