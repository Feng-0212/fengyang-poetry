// ============================================================
// API: 当前登录用户（/api/auth/me）
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { requireUser, toPublicUser } from "@/lib/user";

export async function GET(req: NextRequest) {
  const result = await requireUser(req);
  if ("error" in result) return result.error;
  return NextResponse.json({ user: toPublicUser(result.user) });
}
