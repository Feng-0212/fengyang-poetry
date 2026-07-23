// ============================================================
// 四时墨苑 - 类型定义
// ============================================================

export type SeasonKey = "spring" | "summer" | "autumn" | "winter";

// ============================================================
// SolarTermMeta（节气元数据）
// ============================================================
export interface SolarTermMeta {
  key: SolarTermKey;
  name: string;
  nameEn: string;
  season: SeasonKey;
  dateRange: string;
  color: string;
  secondaryColor: string;
  imagery: string;
  animation: "snow" | "rain" | "leaf" | "firefly" | "petal" | "none";
}

export type SolarTermKey =
  | "lichun"
  | "yushui"
  | "jingzhe"
  | "chunfen"
  | "qingming"
  | "guyu"
  | "lixia"
  | "xiaoman"
  | "mangzhong"
  | "xiazhi"
  | "xiaoshu"
  | "dashu"
  | "liqiu"
  | "chushu"
  | "bailu"
  | "qiufen"
  | "hanlu"
  | "shuangjiang"
  | "lidong"
  | "xiaoxue"
  | "daxue"
  | "dongzhi"
  | "xiaohan"
  | "dahan";

export interface Poem {
  id: string;
  collectionId: string; // 所属藏
  title: string;
  author: string; // 作者，未填默认「佚名」
  dynasty: string; // 朝代，未填默认「佚名」
  content: string;
  annotation?: string;
  aiCommentary?: string; // AI 赏析别名（与用户随笔分离）
  coverImage?: string; // AI 配图 URL 或 dataURL
  tags?: string[]; // 用户自定义标签（如：思乡、山水、豪放）
  aiAnnotation?: string; // AI 赏析（长文本，由 AI 生成）
  aiImageUrl?: string; // AI 配图 URL
  season: SeasonKey;
  solarTerm: SolarTermKey;
  isFavorite: boolean;
  favoriteCount: number; // 收藏计数（0 = 未收藏，>=1 = 已收藏且记录收藏人数）
  createdAt: number;
  updatedAt: number;
  deletedAt?: number; // 回收站
}

// ============================================================
// Collection 类型（藏）
// ============================================================
export type CollectionLayout = "classic" | "list" | "gallery";

export interface Collection {
  id: string;
  slug: string; // 路由用
  name: string; // 主名（如：四时墨苑）
  subname: string; // 副标（如：节令二十四）
  blurb: string; // 一句诗化简介
  seal: string; // 印章单字
  glyph: string; // 主题图标（emoji 或字）
  color: string; // 主色（朱砂/青绿/玄黑 等）
  accent: string; // 副色
  background: string; // 背景描述关键词
  layout: CollectionLayout;
  isSystem: boolean; // 系统预置
  createdAt: number;
  updatedAt: number;
  poemCount: number; // 缓存
}

// 预置藏 ID 常量
export const COLLECTION_IDS = {
  SISHI_MOYUAN: "sishi-moyuan",
  YUEXIA_SHANHE: "yuexia-shanhe",
  GUANSHAN_CI: "guanshan-ci",
  YANYU_GE: "yanyu-ge",
  TONGXIN_ZHAI: "tongxin-zhai",
  XINSHI_LIN: "xinshi-lin",
} as const;

// ============================================================
// 壁纸尺寸
// ============================================================
export type WallpaperSize = "mobile" | "tablet" | "desktop";
export type WallpaperStyle = "ink" | "seal" | "elegant";
export type WallpaperOptions = {
  size: WallpaperSize;
  style: WallpaperStyle;
};

export const WALLPAPER_SIZES: Record<WallpaperSize, { width: number; height: number }> = {
  mobile: { width: 1080, height: 2340 },
  tablet: { width: 1536, height: 2048 },
  desktop: { width: 1920, height: 1080 },
};

// ============================================================
// Poem + Collection 组合类型（用于展示时携带藏信息）
// ============================================================
export interface PoemWithCollection {
  poem: Poem;
  collection: Collection;
}
