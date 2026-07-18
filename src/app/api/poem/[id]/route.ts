// ============================================================
// API: 单首诗词（GET / PUT / DELETE）
// ============================================================
import { NextResponse } from "next/server";
import type { Poem } from "@/types/poem";

async function getKv() {
  try {
    const mod = await import("@upstash/redis");
    if (mod.Redis) {
      // 兼容 Upstash Redis 和 Vercel KV 两种环境变量格式
      const url =
        process.env.UPSTASH_REDIS_REST_URL ||
        process.env.KV_REST_API_URL ||
        process.env.REDIS_URL ||
        "";
      const token =
        process.env.UPSTASH_REDIS_REST_TOKEN ||
        process.env.KV_REST_API_TOKEN ||
        "";
      if (url) {
        return new mod.Redis({ url, token });
      }
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
  if (kv) {
    await kv.set(KV_KEY, poems);
  } else {
    (globalThis as any).__poems = poems;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const poems = await getPoems();
  const poem = poems.find((p) => p.id === id);
  if (!poem) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ poem });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const poems = await getPoems();
  const idx = poems.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  poems[idx] = { ...poems[idx], ...body, updatedAt: Date.now() };
  await setPoems(poems);
  return NextResponse.json({ poem: poems[idx] });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const poems = await getPoems();
  const idx = poems.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(req.url);
  if (url.searchParams.get("permanent") === "1") {
    // 物理删除
    poems.splice(idx, 1);
  } else {
    // 软删除
    poems[idx].deletedAt = Date.now();
  }
  await setPoems(poems);
  return NextResponse.json({ ok: true });
}
