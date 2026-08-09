// ============================================================
// API: 单首诗词（GET / PUT / DELETE）
// 多用户：GET 按可见性过滤；PUT/DELETE 需登录且为本人
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import type { Poem } from "@/types/poem";
import { requireUser, optionalUser, isPoemVisible, canModifyPoem } from "@/lib/user";

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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await optionalUser(req);
  const poems = await getPoems();
  const poem = poems.find((p) => p.id === id);
  if (!poem || poem.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // 可见性：private 且非本人 → 404（不暴露存在性）
  if (!isPoemVisible(poem, user?.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ poem });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const user = auth.user;

  const { id } = await params;
  const body = await req.json();
  const poems = await getPoems();
  const idx = poems.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 仅本人可改
  if (!canModifyPoem(poems[idx], user)) {
    return NextResponse.json({ error: "forbidden", message: "无权修改他人的诗词" }, { status: 403 });
  }

  // 防篡改：禁止改写归属字段
  const safeBody: Record<string, unknown> = { ...body };
  delete safeBody.ownerId;
  delete safeBody.ownerName;
  delete safeBody.id;
  poems[idx] = { ...poems[idx], ...safeBody, updatedAt: Date.now() } as Poem;
  await setPoems(poems);
  return NextResponse.json({ poem: poems[idx] });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const user = auth.user;

  const { id } = await params;
  const poems = await getPoems();
  const idx = poems.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 仅本人可删
  if (!canModifyPoem(poems[idx], user)) {
    return NextResponse.json({ error: "forbidden", message: "无权删除他人的诗词" }, { status: 403 });
  }

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
