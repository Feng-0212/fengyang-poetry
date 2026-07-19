// ============================================================
// API: 藏操作（DELETE 整个藏及其诗词）
// ============================================================
import { NextResponse } from "next/server";
import type { Poem } from "@/types/poem";

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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let poems = await getPoems();
  const before = poems.length;
  poems = poems.filter((p) => p.collectionId !== id);
  const deleted = before - poems.length;
  await setPoems(poems);
  return NextResponse.json({ ok: true, deleted });
}
