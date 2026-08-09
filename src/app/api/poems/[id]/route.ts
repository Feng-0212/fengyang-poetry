// ============================================================
// API: 单首诗局部更新（PATCH /api/poems/[id]）
// 用于：AI 自动打标签后的 tags 更新
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import type { Poem } from "@/types/poem";
import { requireUser, canModifyPoem } from "@/lib/user";
import { getPoems, setPoems } from "@/lib/store";

// PATCH /api/poems/[id] — 局部更新，返回更新后的 poem
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 登录校验
  const auth = await requireUser(req);
  if ("error" in auth) return auth.error;
  const user = auth.user;

  try {
    const { id } = await params;
    const body = await req.json();

    const poems = await getPoems();
    const idx = poems.findIndex((p) => p.id === id);

    if (idx === -1) {
      return NextResponse.json({ error: "Poem not found" }, { status: 404 });
    }

    // 仅本人可改
    if (!canModifyPoem(poems[idx], user)) {
      return NextResponse.json({ error: "forbidden", message: "无权修改他人的诗词" }, { status: 403 });
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
