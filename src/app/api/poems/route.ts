// ============================================================
// API: 诗词 CRUD（Upstash Redis 持久化）
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import type { Poem } from "@/types/poem";
import { checkPassword } from "@/lib/auth";

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

export async function POST(req: NextRequest) {
  // 密码校验
  const authErr = checkPassword(req);
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const now = Date.now();
    const id = `poem-${now}-${Math.random().toString(36).slice(2, 8)}`;
    const poem: Poem = {
      id,
      collectionId: body.collectionId,
      title: body.title,
      author: body.author || "佚名",
      dynasty: body.dynasty || "佚名",
      content: body.content,
      season: body.season || "",
      solarTerm: body.solarTerm || "",
      annotation: body.annotation || undefined,
      tags: Array.isArray(body.tags) ? body.tags : [],
      isFavorite: false,
      favoriteCount: 0,
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
