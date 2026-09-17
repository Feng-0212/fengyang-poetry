// ============================================================
// API: 诗藏词库整句验证代理（/api/shicang/verify）
// 服务端转发到诗藏 /api/verify-line：避免跨域，也隔离源站细节
// 诗藏不在线时返回 504 + reason=upstream_unreachable，前端据其提示
// ============================================================
import { NextRequest, NextResponse } from "next/server";

const SHICANG_BASE = process.env.SHICANG_BASE || "https://shicang.poeagent.top";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const char = (req.nextUrl.searchParams.get("char") || "").trim();

  if (!q) {
    return NextResponse.json({ ok: true, matched: false, reason: "empty" });
  }

  const params = new URLSearchParams({ q });
  if (char) params.set("char", char);

  try {
    const res = await fetch(`${SHICANG_BASE}/api/verify-line?${params.toString()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
      headers: { "User-Agent": "moyun-pavilion/1.0 (feihua-ling)" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, matched: false, reason: "upstream_error" },
        { status: 502 }
      );
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(
      { ok: false, matched: false, reason: "upstream_unreachable" },
      { status: 504 }
    );
  }
}
