// ============================================================
// 诗藏家族门户分流：poeagent.top 根域名 → 门户页
// poetry-garden.poeagent.top 等子域名不受影响，照常进入墨韵阁
// 门户 HTML 见 src/app/portal/route.ts
// ============================================================
import { NextRequest, NextResponse } from "next/server";

const PORTAL_HOSTS = new Set(["poeagent.top", "www.poeagent.top"]);

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase();
  if (!PORTAL_HOSTS.has(host)) return NextResponse.next();
  /* 门户本身是单页：任何路径都落到 /portal（防自改写循环） */
  if (req.nextUrl.pathname === "/portal") return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/portal";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|api).*)"],
};
