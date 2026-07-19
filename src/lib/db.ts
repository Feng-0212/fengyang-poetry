// ============================================================
// 四时墨苑 - 数据库（Dexie / IndexedDB）
// ============================================================
import Dexie, { type Table } from "dexie";
import type { Poem, Collection } from "@/types/poem";
import { COLLECTION_IDS } from "@/types/poem";

class PoetryDB extends Dexie {
  poems!: Table<Poem, string>;
  collections!: Table<Collection, string>;

  constructor() {
    super("siShiMoYuan");
    this.version(2).stores({
      poems:
        "id, collectionId, createdAt, updatedAt, season, solarTerm, isFavorite, deletedAt",
      collections: "id, slug, name, isSystem, createdAt",
    });
  }
}

export const db = new PoetryDB();

// ============================================================
// 初始化：写入预置藏
// ============================================================
export async function ensureDefaultCollections(): Promise<void> {
  const count = await db.collections.count();
  if (count === 0) {
    const now = Date.now();
    const defaults: Collection[] = [
      {
        id: COLLECTION_IDS.SISHI_MOYUAN,
        slug: "sishi-moyuan",
        name: "四时墨苑",
        subname: "节令二十四",
        blurb: "立春读诗，霜降吟词",
        seal: "季",
        glyph: "🌸",
        color: "#C14A3F",
        accent: "#D4A574",
        background: "rice-paper-solar",
        layout: "classic",
        isSystem: true,
        createdAt: now,
        updatedAt: now,
        poemCount: 0,
      },
      {
        id: COLLECTION_IDS.YUEXIA_SHANHE,
        slug: "yuexia-shanhe",
        name: "月下山河",
        subname: "山川风物",
        blurb: "月落乌啼霜满天",
        seal: "山",
        glyph: "🏔️",
        color: "#2C5F5F",
        accent: "#7BA098",
        background: "rice-paper-mist",
        layout: "gallery",
        isSystem: true,
        createdAt: now,
        updatedAt: now,
        poemCount: 0,
      },
      {
        id: COLLECTION_IDS.GUANSHAN_CI,
        slug: "guanshan-ci",
        name: "关山词",
        subname: "边塞雄风",
        blurb: "醉卧沙场君莫笑",
        seal: "关",
        glyph: "⚔️",
        color: "#8B3A3A",
        accent: "#C9974D",
        background: "rice-paper-sand",
        layout: "list",
        isSystem: true,
        createdAt: now,
        updatedAt: now,
        poemCount: 0,
      },
      {
        id: COLLECTION_IDS.YANYU_GE,
        slug: "yanyu-ge",
        name: "烟雨阁",
        subname: "离思愁绪",
        blurb: "执手相看泪眼",
        seal: "雨",
        glyph: "🌧️",
        color: "#5B7B9A",
        accent: "#A8B8C8",
        background: "rice-paper-rain",
        layout: "list",
        isSystem: true,
        createdAt: now,
        updatedAt: now,
        poemCount: 0,
      },
      {
        id: COLLECTION_IDS.TONGXIN_ZHAI,
        slug: "tongxin-zhai",
        name: "童心斋",
        subname: "童趣启蒙",
        blurb: "鹅鹅鹅曲项向天歌",
        seal: "童",
        glyph: "🪁",
        color: "#E8A87C",
        accent: "#F4C9A0",
        background: "rice-paper-bright",
        layout: "gallery",
        isSystem: true,
        createdAt: now,
        updatedAt: now,
        poemCount: 0,
      },
      {
        id: COLLECTION_IDS.XINSHI_LIN,
        slug: "xinshi-lin",
        name: "新诗林",
        subname: "现代诗钞",
        blurb: "从前的日色变得慢",
        seal: "新",
        glyph: "🌲",
        color: "#6B8E7B",
        accent: "#A8C4B0",
        background: "rice-paper-modern",
        layout: "gallery",
        isSystem: true,
        createdAt: now,
        updatedAt: now,
        poemCount: 0,
      },
    ];
    await db.collections.bulkAdd(defaults);
  }

  // 更新已有 collection 的 seal 字段（修复旧数据）
  const sealUpdates: Record<string, string> = {
    [COLLECTION_IDS.SISHI_MOYUAN]: "季",
    [COLLECTION_IDS.TONGXIN_ZHAI]: "童",
    [COLLECTION_IDS.XINSHI_LIN]: "新",
  };
  for (const [id, seal] of Object.entries(sealUpdates)) {
    const existing = await db.collections.get(id);
    if (existing && existing.seal !== seal) {
      await db.collections.update(id, { seal });
    }
  }
}

// ============================================================
// Poem CRUD
// ============================================================
// 别名（兼容旧代码）
export const createPoem = addPoem;

export async function addPoem(
  poem: Omit<Poem, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = Date.now();
  const id = `poem-${now}-${Math.random().toString(36).slice(2, 8)}`;
  await db.poems.add({
    ...poem,
    id,
    createdAt: now,
    updatedAt: now,
  });
  await updateCollectionCount(poem.collectionId);
  return id;
}

export async function updatePoem(
  id: string,
  changes: Partial<Poem>
): Promise<void> {
  const poem = await db.poems.get(id);
  await db.poems.update(id, {
    ...changes,
    updatedAt: Date.now(),
  });
  if (changes.collectionId && poem && changes.collectionId !== poem.collectionId) {
    await updateCollectionCount(poem.collectionId);
    await updateCollectionCount(changes.collectionId);
  } else if (poem) {
    await updateCollectionCount(poem.collectionId);
  }
}

export async function deletePoem(id: string): Promise<void> {
  const poem = await db.poems.get(id);
  await db.poems.update(id, { deletedAt: Date.now() });
  if (poem) await updateCollectionCount(poem.collectionId);
}

export async function permanentlyDeletePoem(id: string): Promise<void> {
  const poem = await db.poems.get(id);
  await db.poems.delete(id);
  if (poem) await updateCollectionCount(poem.collectionId);
}

export async function toggleFavorite(id: string): Promise<void> {
  const poem = await db.poems.get(id);
  if (poem) {
    await db.poems.update(id, { isFavorite: !poem.isFavorite });
  }
}

export async function getAllPoems(): Promise<Poem[]> {
  return await db.poems.toArray();
}

export async function getPoemsBySolarTerm(solarTerm: string): Promise<Poem[]> {
  const all = await db.poems.toArray();
  return all
    .filter((p) => !p.deletedAt && p.solarTerm === solarTerm)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getPoemsBySeason(season: string): Promise<Poem[]> {
  const all = await db.poems.toArray();
  return all
    .filter((p) => !p.deletedAt && p.season === season)
    .sort((a, b) => b.createdAt - a.createdAt);
}

// ============================================================
// Collection CRUD
// ============================================================
export async function getAllCollections(): Promise<Collection[]> {
  await ensureDefaultCollections();
  return await db.collections.toArray();
}

export async function getCollectionBySlug(
  slug: string
): Promise<Collection | undefined> {
  await ensureDefaultCollections();
  return await db.collections.where("slug").equals(slug).first();
}

export async function getCollectionById(
  id: string
): Promise<Collection | undefined> {
  await ensureDefaultCollections();
  return await db.collections.get(id);
}

export async function addCollection(
  data: Omit<Collection, "id" | "createdAt" | "updatedAt" | "poemCount" | "isSystem">
): Promise<string> {
  const now = Date.now();
  const id = `custom-${now}-${Math.random().toString(36).slice(2, 8)}`;
  const slug =
    data.slug ||
    data.name.toLowerCase().replace(/\s+/g, "-") +
      "-" +
      Math.random().toString(36).slice(2, 6);

  await db.collections.add({
    ...data,
    id,
    slug,
    isSystem: false,
    createdAt: now,
    updatedAt: now,
    poemCount: 0,
  });

  return id;
}

export async function deleteCollection(id: string): Promise<void> {
  // 同时删除该藏下所有诗词
  const poems = await db.poems.where("collectionId").equals(id).toArray();
  await db.transaction("rw", db.poems, db.collections, async () => {
    await db.poems.bulkDelete(poems.map((p) => p.id));
    await db.collections.delete(id);
  });
}

async function updateCollectionCount(collectionId: string): Promise<void> {
  const count = await db.poems
    .where("collectionId")
    .equals(collectionId)
    .filter((p) => !p.deletedAt)
    .count();
  await db.collections.update(collectionId, { poemCount: count });
}

// ============================================================
// 数据导入导出
// ============================================================
export async function exportAllData(): Promise<Poem[]> {
  return await db.poems.toArray();
}

export async function importData(poems: Poem[]): Promise<void> {
  await db.poems.bulkPut(poems);
  // 更新所有涉及的藏
  const collectionIds = [...new Set(poems.map((p) => p.collectionId))];
  for (const id of collectionIds) {
    await updateCollectionCount(id);
  }
}
