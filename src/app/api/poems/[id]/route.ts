// ============================================================
// API: 单首诗局部更新（PATCH /api/poems/[id]）
// 用于：AI 自动打标签后的 tags 更新
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import type { Poem } from "@/types/poem";
import { checkPassword } from "@/lib/auth";

const KV_KEY = "poems:all";

async function getKv() {
  try {
    const mod = await import("@upstash/redis");
    if (mod.Redis) {
      const url =
        process.env.UPSTASH_REDIS_REST_URL ||
        process.env.KV_REST_API_URL ||
        process.env.REDIS_URL ||
        "";
      const token =
        process.env.UPSTASH_REDIS_REST_TOKEN ||
        process.env.KV_REST_API_TOKEN ||
        "";
      if (url) return new mod.Redis({ url, token });
    }
  } catch {}
  return null;
}

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

// PATCH /api/poems/[id] — 局部更新，返回更新后的 poem
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkPassword(req);
  if (authErr) return authErr;

  try {
    const { id } = await params;
    const body = await req.json();

    const poems = await getPoems();
    const idx = poems.findIndex((p) => p.id === id);

    if (idx === -1) {
      return NextResponse.json({ error: "Poem not found" }, { status: 404 });
    }

    // 只允许安全字段被外部更新（tags / aiAnnotation / aiImageUrl）
    const safeFields: (keyof Poem)[] = ["tags", "aiAnnotation", "aiImageUrl"];
    for (const key of safeFields) {
      if (key in body) {
        (poems[idx] as unknown as Record<string, unknown>)[key] = body[key];
      }
    }
    poems[idx].updatedAt = Date.now();

    await setPoems(poems);

    return NextResponse.json({ poem: poems[idx] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "update failed" },
      { status: 500 }
    );
  }
}
