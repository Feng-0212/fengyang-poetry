// ============================================================
// 统一数据访问层（数据存储层）
// 所有 API 路由通过本模块读写诗词/藏/评论，消除重复的 Redis 连接与读写逻辑。
// - 生产：Upstash Redis（lib/kv.ts 统一封装，兼容多套环境变量）
// - 本地无 Redis：进程内存回退（getKv 内存模式 + globalThis 兜底）
// ============================================================
import type { Poem, Collection, PoemComment } from "@/types/poem";
import { getKv } from "@/lib/kv";

const POEMS_KEY = "poems:all";
const COLLECTIONS_KEY = "collections:all";

// ============================================================
// 诗词
// ============================================================
export async function getPoems(): Promise<Poem[]> {
  const kv = await getKv();
  if (kv) {
    try {
      const data = await kv.get<Poem[]>(POEMS_KEY);
      return data || [];
    } catch {
      /* 落到内存回退 */
    }
  }
  // 本地 dev 内存回退（无 Redis 时）
  if (!(globalThis as any).__poems) (globalThis as any).__poems = [];
  return (globalThis as any).__poems;
}

export async function setPoems(poems: Poem[]): Promise<void> {
  const kv = await getKv();
  if (kv) {
    try {
      await kv.set(POEMS_KEY, poems);
      return;
    } catch {
      /* 落到内存回退 */
    }
  }
  (globalThis as any).__poems = poems;
}

// ============================================================
// 藏（Collection）
// ============================================================
export async function getCollections(): Promise<Collection[]> {
  const kv = await getKv();
  if (kv) {
    try {
      const data = await kv.get<Collection[]>(COLLECTIONS_KEY);
      return data || [];
    } catch {
      /* 落到内存回退 */
    }
  }
  if (!(globalThis as any).__collections) (globalThis as any).__collections = [];
  return (globalThis as any).__collections;
}

export async function setCollections(cols: Collection[]): Promise<void> {
  const kv = await getKv();
  if (kv) {
    try {
      await kv.set(COLLECTIONS_KEY, cols);
      return;
    } catch {
      /* 落到内存回退 */
    }
  }
  (globalThis as any).__collections = cols;
}

// ============================================================
// 评论（comments:{poemId}）
// ============================================================
export async function getComments(poemId: string): Promise<PoemComment[]> {
  const kv = await getKv();
  if (kv) {
    try {
      return (await kv.get<PoemComment[]>(`comments:${poemId}`)) || [];
    } catch {
      /* 落到内存回退 */
    }
  }
  if (!(globalThis as any).__comments) (globalThis as any).__comments = {};
  return (globalThis as any).__comments[poemId] || [];
}

export async function setComments(
  poemId: string,
  comments: PoemComment[]
): Promise<void> {
  const kv = await getKv();
  if (kv) {
    try {
      await kv.set(`comments:${poemId}`, comments);
      return;
    } catch {
      /* 落到内存回退 */
    }
  }
  (globalThis as any).__comments = (globalThis as any).__comments || {};
  (globalThis as any).__comments[poemId] = comments;
}
