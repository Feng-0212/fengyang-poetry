// ============================================================
// API: 诗词 CRUD（Upstash Redis 持久化）
// 多用户：GET 按可见性过滤（public 或本人 private）；POST 需登录并归属当前用户
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import type { Poem } from "@/types/poem";
import { requireUser, optionalUser, isPoemVisible } from "@/lib/user";

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

// ============================================================
// 回收站自动清理：超过 30 天的软删除诗词物理清除
// 惰性执行（每天最多一次，Redis 记时），不阻塞读取响应
// ============================================================
const TRASH_TTL = 30 * 24 * 60 * 60 * 1000; // 30 天
const PURGE_INTERVAL = 24 * 60 * 60 * 1000; // 每天最多执行一次

async function lazyPurgeTrash(): Promise<void> {
  try {
    const kv = await getKv();
    if (!kv) return; // 无 Redis（本地内存回退）时跳过
    const lastKey = "trash:lastPurge";
    const last = await kv.get<number>(lastKey);
    const now = Date.now();
    if (last && now - last < PURGE_INTERVAL) return;
    await kv.set(lastKey, now, { ex: 60 * 60 * 24 * 2 });
    const poems = await getPoems();
    const cutoff = now - TRASH_TTL;
    const alive = poems.filter((p) => !p.deletedAt || p.deletedAt > cutoff);
    if (alive.length !== poems.length) await setPoems(alive);
  } catch {
    // 清理失败不影响主流程
  }
}

export async function GET(req: NextRequest) {
  try {
    // 惰性清理超期回收站（不阻塞响应）
    void lazyPurgeTrash();
    const user = await optionalUser(req);
    const poems = await getPoems();
    // 可见性过滤：public（含无 owner 的旧数据）或本人 private；同时剔除软删除
    const visible = poems.filter((p) => !p.deletedAt && isPoemVisible(p, user?.id));
    return NextResponse.json({ poems: visible });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch poems" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // 登录校验
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const user = auth.user;

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
      ownerId: user.id,
      ownerName: user.name,
      visibility: body.visibility === "private" ? "private" : "public",
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
