// ============================================================
// 四时墨苑 - 二十四节气系统
// ============================================================
import type { SolarTermKey, SolarTermMeta, SeasonKey } from "@/types/poem";

// 二十四节气元数据表
export const SOLAR_TERMS_META: SolarTermMeta[] = [
  {
    key: "lichun",
    name: "立春",
    nameEn: "Lichun",
    season: "spring",
    dateRange: "2月3-5日",
    color: "#8B9A6B",
    secondaryColor: "#C5D5A0",
    imagery: "东风解冻，柳芽新绿",
    animation: "petal",
  },
  {
    key: "yushui",
    name: "雨水",
    nameEn: "Yushui",
    season: "spring",
    dateRange: "2月18-20日",
    color: "#7A9BB5",
    secondaryColor: "#A8C4D8",
    imagery: "细雨如丝，润物无声",
    animation: "rain",
  },
  {
    key: "jingzhe",
    name: "惊蛰",
    nameEn: "Jingzhe",
    season: "spring",
    dateRange: "3月5-7日",
    color: "#6B8B6B",
    secondaryColor: "#8FAF8F",
    imagery: "春雷始鸣，蛰虫始振",
    animation: "petal",
  },
  {
    key: "chunfen",
    name: "春分",
    nameEn: "Chunfen",
    season: "spring",
    dateRange: "3月20-22日",
    color: "#A8C090",
    secondaryColor: "#D4E4BC",
    imagery: "昼夜均分，玄鸟归来",
    animation: "petal",
  },
  {
    key: "qingming",
    name: "清明",
    nameEn: "Qingming",
    season: "spring",
    dateRange: "4月4-6日",
    color: "#C4B87A",
    secondaryColor: "#E0D4A8",
    imagery: "烟雨纷纷，踏青祭祖",
    animation: "rain",
  },
  {
    key: "guyu",
    name: "谷雨",
    nameEn: "Guyu",
    season: "spring",
    dateRange: "4月19-21日",
    color: "#7A9A6B",
    secondaryColor: "#A0C090",
    imagery: "雨生百谷，萍始生",
    animation: "rain",
  },
  {
    key: "lixia",
    name: "立夏",
    nameEn: "Lixia",
    season: "summer",
    dateRange: "5月5-7日",
    color: "#7AAB8A",
    secondaryColor: "#A0CAAA",
    imagery: "夏木成荫，蝼蝈鸣",
    animation: "firefly",
  },
  {
    key: "xiaoman",
    name: "小满",
    nameEn: "Xiaoman",
    season: "summer",
    dateRange: "5月20-22日",
    color: "#9AB87A",
    secondaryColor: "#BED4A0",
    imagery: "麦穗初盈，苦菜秀",
    animation: "firefly",
  },
  {
    key: "mangzhong",
    name: "芒种",
    nameEn: "Mangzhong",
    season: "summer",
    dateRange: "6月5-7日",
    color: "#C4A04A",
    secondaryColor: "#E0C87A",
    imagery: "稻麦始熟，螳螂生",
    animation: "firefly",
  },
  {
    key: "xiazhi",
    name: "夏至",
    nameEn: "Xiazhi",
    season: "summer",
    dateRange: "6月21-22日",
    color: "#5A8A7A",
    secondaryColor: "#8ABAAA",
    imagery: "荷风送香，鹿角解",
    animation: "firefly",
  },
  {
    key: "xiaoshu",
    name: "小暑",
    nameEn: "Xiaoshu",
    season: "summer",
    dateRange: "7月6-8日",
    color: "#B8784A",
    secondaryColor: "#D8A878",
    imagery: "温风至，蟋蟀居壁",
    animation: "firefly",
  },
  {
    key: "dashu",
    name: "大暑",
    nameEn: "Dashu",
    season: "summer",
    dateRange: "7月22-24日",
    color: "#C8604A",
    secondaryColor: "#E89078",
    imagery: "萤火流光，腐草为萤",
    animation: "firefly",
  },
  {
    key: "liqiu",
    name: "立秋",
    nameEn: "Liqiu",
    season: "autumn",
    dateRange: "8月7-9日",
    color: "#A89060",
    secondaryColor: "#C8B888",
    imagery: "梧桐叶落，凉风至",
    animation: "leaf",
  },
  {
    key: "chushu",
    name: "处暑",
    nameEn: "Chushu",
    season: "autumn",
    dateRange: "8月22-24日",
    color: "#A8A070",
    secondaryColor: "#C8C0A0",
    imagery: "暑气渐消，鹰乃祭鸟",
    animation: "leaf",
  },
  {
    key: "bailu",
    name: "白露",
    nameEn: "Bailu",
    season: "autumn",
    dateRange: "9月7-9日",
    color: "#9AADB8",
    secondaryColor: "#B8CAD4",
    imagery: "露凝月白，鸿雁来",
    animation: "rain",
  },
  {
    key: "qiufen",
    name: "秋分",
    nameEn: "Qiufen",
    season: "autumn",
    dateRange: "9月22-24日",
    color: "#B87A50",
    secondaryColor: "#D4A888",
    imagery: "枫红蟹肥，雷始收声",
    animation: "leaf",
  },
  {
    key: "hanlu",
    name: "寒露",
    nameEn: "Hanlu",
    season: "autumn",
    dateRange: "10月8-9日",
    color: "#8A6858",
    secondaryColor: "#AC9080",
    imagery: "露寒而冷，鸿雁来宾",
    animation: "leaf",
  },
  {
    key: "shuangjiang",
    name: "霜降",
    nameEn: "Shuangjiang",
    season: "autumn",
    dateRange: "10月23-24日",
    color: "#8A7A8A",
    secondaryColor: "#ACA0AC",
    imagery: "霜打红叶，豺乃祭兽",
    animation: "leaf",
  },
  {
    key: "lidong",
    name: "立冬",
    nameEn: "Lidong",
    season: "winter",
    dateRange: "11月7-8日",
    color: "#7A8A9A",
    secondaryColor: "#A0B0C0",
    imagery: "初冬微寒，水始冰",
    animation: "snow",
  },
  {
    key: "xiaoxue",
    name: "小雪",
    nameEn: "Xiaoxue",
    season: "winter",
    dateRange: "11月22-23日",
    color: "#A8B0B8",
    secondaryColor: "#C8D0D8",
    imagery: "初雪轻飘，虹藏不见",
    animation: "snow",
  },
  {
    key: "daxue",
    name: "大雪",
    nameEn: "Daxue",
    season: "winter",
    dateRange: "12月6-8日",
    color: "#B8C4CC",
    secondaryColor: "#D4E0E8",
    imagery: "大雪封河，鹖鴠不鸣",
    animation: "snow",
  },
  {
    key: "dongzhi",
    name: "冬至",
    nameEn: "Dongzhi",
    season: "winter",
    dateRange: "12月21-23日",
    color: "#6878A8",
    secondaryColor: "#909EC8",
    imagery: "阳生春来，蚯蚓结",
    animation: "snow",
  },
  {
    key: "xiaohan",
    name: "小寒",
    nameEn: "Xiaohan",
    season: "winter",
    dateRange: "1月5-7日",
    color: "#687888",
    secondaryColor: "#909CA8",
    imagery: "寒气渐深，雁北乡",
    animation: "snow",
  },
  {
    key: "dahan",
    name: "大寒",
    nameEn: "Dahan",
    season: "winter",
    dateRange: "1月20-21日",
    color: "#587888",
    secondaryColor: "#8098A8",
    imagery: "冰封大地，鸡始乳",
    animation: "snow",
  },
];

// 节气名 → key 映射
const SOLAR_TERM_BY_DATE: Array<{ start: number; end: number; key: SolarTermKey }> = [
  // 1月
  { start: 101, end: 107, key: "xiaohan" },
  { start: 108, end: 121, key: "dahan" },
  { start: 122, end: 131, key: "dahan" },
  // 2月
  { start: 201, end: 202, key: "dahan" },
  { start: 203, end: 205, key: "lichun" },
  { start: 206, end: 217, key: "lichun" },
  { start: 218, end: 220, key: "yushui" },
  { start: 221, end: 228, key: "yushui" },
  // 3月
  { start: 301, end: 304, key: "yushui" },
  { start: 305, end: 307, key: "jingzhe" },
  { start: 308, end: 319, key: "jingzhe" },
  { start: 320, end: 322, key: "chunfen" },
  { start: 323, end: 331, key: "chunfen" },
  // 4月
  { start: 401, end: 403, key: "chunfen" },
  { start: 404, end: 406, key: "qingming" },
  { start: 407, end: 418, key: "qingming" },
  { start: 419, end: 421, key: "guyu" },
  { start: 422, end: 430, key: "guyu" },
  // 5月
  { start: 501, end: 504, key: "guyu" },
  { start: 505, end: 507, key: "lixia" },
  { start: 508, end: 519, key: "lixia" },
  { start: 520, end: 522, key: "xiaoman" },
  { start: 523, end: 531, key: "xiaoman" },
  // 6月
  { start: 601, end: 604, key: "xiaoman" },
  { start: 605, end: 607, key: "mangzhong" },
  { start: 608, end: 620, key: "mangzhong" },
  { start: 621, end: 622, key: "xiazhi" },
  { start: 623, end: 630, key: "xiazhi" },
  // 7月
  { start: 701, end: 705, key: "xiazhi" },
  { start: 706, end: 708, key: "xiaoshu" },
  { start: 709, end: 721, key: "xiaoshu" },
  { start: 722, end: 724, key: "dashu" },
  { start: 725, end: 731, key: "dashu" },
  // 8月
  { start: 801, end: 706, key: "dashu" }, // 占位，8月从1号继续
  { start: 707, end: 708, key: "dashu" }, // 占位
  { start: 801, end: 806, key: "dashu" },
  { start: 807, end: 809, key: "liqiu" },
  { start: 810, end: 821, key: "liqiu" },
  { start: 822, end: 824, key: "chushu" },
  { start: 825, end: 831, key: "chushu" },
  // 9月
  { start: 901, end: 906, key: "chushu" },
  { start: 907, end: 909, key: "bailu" },
  { start: 910, end: 921, key: "bailu" },
  { start: 922, end: 924, key: "qiufen" },
  { start: 925, end: 930, key: "qiufen" },
  // 10月
  { start: 1001, end: 907, key: "qiufen" }, // 占位
  { start: 1008, end: 909, key: "hanlu" },
  { start: 1010, end: 922, key: "hanlu" },
  { start: 1023, end: 1024, key: "shuangjiang" },
  { start: 1025, end: 1031, key: "shuangjiang" },
  // 11月
  { start: 1101, end: 1106, key: "shuangjiang" },
  { start: 1107, end: 1108, key: "lidong" },
  { start: 1109, end: 1121, key: "lidong" },
  { start: 1122, end: 1123, key: "xiaoxue" },
  { start: 1124, end: 1130, key: "xiaoxue" },
  // 12月
  { start: 1201, end: 1205, key: "xiaoxue" },
  { start: 1206, end: 1208, key: "daxue" },
  { start: 1209, end: 1220, key: "daxue" },
  { start: 1221, end: 1223, key: "dongzhi" },
  { start: 1224, end: 1231, key: "dongzhi" },
];

/**
 * 根据日期获取节气
 * @param date Date 对象
 */
export function getSolarTerm(date: Date): SolarTermMeta {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const key = `${month.toString().padStart(2, "0")}${day.toString().padStart(2, "0")}`;
  const numKey = parseInt(key, 10);

  // 遍历查找
  for (const entry of SOLAR_TERM_BY_DATE) {
    if (numKey >= entry.start && numKey <= entry.end) {
      const meta = SOLAR_TERMS_META.find((m) => m.key === entry.key);
      if (meta) return meta;
    }
  }

  // 默认返回立春（兜底）
  return SOLAR_TERMS_META.find((m) => m.key === "lichun")!;
}

/** 获取当前季节 */
export function getCurrentSeason(): SeasonKey {
  const meta = getSolarTerm(new Date());
  return meta.season;
}

/** 根据节气 key 获取元数据 */
export function getSolarTermMeta(key: SolarTermKey): SolarTermMeta | undefined {
  return SOLAR_TERMS_META.find((m) => m.key === key);
}

/** 根据季节获取所有节气 */
export function getSolarTermsBySeason(season: SeasonKey): SolarTermMeta[] {
  return SOLAR_TERMS_META.filter((m) => m.season === season);
}

/** 获取季节名称（中文） */
export function getSeasonName(season: SeasonKey): string {
  const map: Record<SeasonKey, string> = {
    spring: "春",
    summer: "夏",
    autumn: "秋",
    winter: "冬",
  };
  return map[season];
}

/** 季节颜色 */
export function getSeasonColors(season: SeasonKey): { primary: string; secondary: string } {
  const map: Record<SeasonKey, { primary: string; secondary: string }> = {
    spring: { primary: "#A8C090", secondary: "#D4E4BC" },
    summer: { primary: "#7AAB8A", secondary: "#A0CAAA" },
    autumn: { primary: "#B87A50", secondary: "#D4A888" },
    winter: { primary: "#6878A8", secondary: "#909EC8" },
  };
  return map[season];
}
