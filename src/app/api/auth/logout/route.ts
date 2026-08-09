// ============================================================
// API: 注销（/api/auth/logout）— 删除当前会话
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/user";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (token) await deleteSession(token);
  return NextResponse.json({ ok: true });
}
