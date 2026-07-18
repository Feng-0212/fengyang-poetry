// ============================================================
// API: 诗词 CRUD（Upstash Redis 持久化）
// ============================================================
import { NextResponse } from "next/server";
import type { Poem } from "@/types/poem";

async function getKv() {
  try {
    const mod = await import("@upstash/redis");
    if (process.env.UPSTASH_REDIS_REST_URL && mod.Redis) {
      return new mod.Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
      });
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
  // 本地 dev 内存回退
  if (!(globalThis as any).__poems) (globalThis as any).__poems = [];
  return (globalThis as any).__poems;
}

async function setPoems(poems: Poem[]): Promise<void> {
  const kv = await getKv();
  if (kv) {
    await kv.set(KV_KEY, poems);
  } else {
    (globalThis as any).__poems = poems;
  }
}

export async function GET() {
  try {
    const poems = await getPoems();
    return NextResponse.json({ poems });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch poems" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const now = Date.now();
    const id = `poem-${now}-${Math.random().toString(36).slice(2, 8)}`;
    const poem: Poem = {
      id,
      collectionId: body.collectionId,
      title: body.title,
      content: body.content,
      season: body.season || "",
      solarTerm: body.solarTerm || "",
      annotation: body.annotation || undefined,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };

    const poems = await getPoems();
    poems.push(poem);
    await setPoems(poems);

    return NextResponse.json({ poem, id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create poem" }, { status: 500 });
  }
}
