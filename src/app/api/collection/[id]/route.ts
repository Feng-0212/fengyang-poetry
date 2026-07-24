// ============================================================
// API: 藏操作（DELETE 整个藏及其诗词）
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import type { Poem, Collection } from "@/types/poem";
import { checkPassword } from "@/lib/auth";

async function getKv() {
  try {
    const mod = await import("@upstash/redis");
    if (mod.Redis) {
      const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
      const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
      if (url) return new mod.Redis({ url, token });
    }
  } catch {}
  return null;
}

const KV_KEY = "poems:all";
const COLLECTIONS_KEY = "collections:all";

async function getPoems(): Promise<Poem[]> {
  const kv = await getKv();
  if (kv) {
    const data = await kv.get<Poem[]>(KV_KEY);
    return data || [];
  }
  if (!(globalThis as any).__poems) (globalThis as any).__poems = [];
  return (globalThis as any).__poems;
}

async function setPoems(poems: Poem[]): Promise<void> {
  const kv = await getKv();
  if (kv) await kv.set(KV_KEY, poems);
  else (globalThis as any).__poems = poems;
}

async function getCollections(): Promise<Collection[]> {
  const kv = await getKv();
  if (kv) {
    const data = await kv.get<Collection[]>(COLLECTIONS_KEY);
    return data || [];
  }
  return [];
}

async function setCollections(cols: Collection[]): Promise<void> {
  const kv = await getKv();
  if (kv) await kv.set(COLLECTIONS_KEY, cols);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkPassword(req);
  if (authErr) return authErr;

  const { id } = await params;
  // 删除该藏下所有诗词
  let poems = await getPoems();
  const before = poems.length;
  poems = poems.filter((p) => p.collectionId !== id);
  const deleted = before - poems.length;
  await setPoems(poems);

  // 删除藏本身
  const cols = await getCollections();
  const newCols = cols.filter((c) => c.id !== id);
  await setCollections(newCols);

  return NextResponse.json({ ok: true, deleted, removedCollection: newCols.length !== cols.length });
}
