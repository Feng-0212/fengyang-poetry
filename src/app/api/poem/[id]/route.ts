// ============================================================
// API: 单首诗词（GET / PUT / DELETE）
// 多用户：GET 按可见性过滤；PUT/DELETE 需登录且为本人
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import type { Poem } from "@/types/poem";
import { requireUser, optionalUser, isPoemVisible, canModifyPoem } from "@/lib/user";
import { getPoems, setPoems } from "@/lib/store";

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
