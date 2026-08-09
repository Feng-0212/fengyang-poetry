// ============================================================
// API: 删除评论（DELETE /api/poem/[id]/comments/[cid]）
// 仅本人可删；诗作者可删其诗下评论（管理自己的评论区）
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import type { Poem, PoemComment } from "@/types/poem";
import { requireUser } from "@/lib/user";

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

const POEMS_KEY = "poems:all";

async function getComments(poemId: string): Promise<PoemComment[]> {
  const kv = await getKv();
  if (kv) {
    return (await kv.get<PoemComment[]>(`comments:${poemId}`)) || [];
  }
  if (!(globalThis as any).__comments) (globalThis as any).__comments = {};
  return (globalThis as any).__comments[poemId] || [];
}

async function setComments(poemId: string, comments: PoemComment[]): Promise<void> {
  const kv = await getKv();
  if (kv) {
    await kv.set(`comments:${poemId}`, comments);
  } else {
    (globalThis as any).__comments = (globalThis as any).__comments || {};
    (globalThis as any).__comments[poemId] = comments;
  }
}

async function getPoem(id: string): Promise<Poem | null> {
  const kv = await getKv();
  if (kv) {
    const poems = (await kv.get<Poem[]>(POEMS_KEY)) || [];
    return poems.find((p) => p.id === id) || null;
  }
  if ((globalThis as any).__poems) {
    return ((globalThis as any).__poems as Poem[]).find((p) => p.id === id) || null;
  }
  return null;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const user = auth.user;

  const { id, cid } = await params;
  const comments = await getComments(id);
  const idx = comments.findIndex((c) => c.id === cid);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const comment = comments[idx];
  const poem = await getPoem(id);
  const isPoemOwner = poem?.ownerId === user.id;
  // 仅评论者本人或诗作者可删
  if (comment.userId !== user.id && !isPoemOwner) {
    return NextResponse.json({ error: "forbidden", message: "无权删除该评论" }, { status: 403 });
  }
  comments.splice(idx, 1);
  await setComments(id, comments);
  return NextResponse.json({ ok: true });
}
