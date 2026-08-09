// ============================================================
// API: 藏集合 CRUD（GET 列表 / POST 新建）
// 多用户：GET 公开可见；POST 需登录并归属当前用户
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import type { Collection } from "@/types/poem";
import { requireUser } from "@/lib/user";

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

const KV_KEY = "collections:all";

async function getCollections(): Promise<Collection[]> {
  const kv = await getKv();
  if (kv) {
    const data = await kv.get<Collection[]>(KV_KEY);
    return data || [];
  }
  return [];
}

async function setCollections(cols: Collection[]): Promise<void> {
  const kv = await getKv();
  if (kv) await kv.set(KV_KEY, cols);
}

export async function GET() {
  const collections = await getCollections();
  return NextResponse.json({ collections });
}

export async function POST(req: NextRequest) {
  // 登录校验
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const user = auth.user;

  const body = await req.json();
  const collections = await getCollections();

  const newCol: Collection = {
    ...body,
    id: body.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: body.createdAt || Date.now(),
    updatedAt: body.updatedAt || Date.now(),
    poemCount: body.poemCount || 0,
    isSystem: false,
    ownerId: user.id,
  };

  // 避免重复
  if (!collections.find((c) => c.id === newCol.id)) {
    collections.push(newCol);
    await setCollections(collections);
  }

  return NextResponse.json({ collection: newCol });
}
