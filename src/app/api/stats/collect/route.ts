// ============================================================
// API: 访问统计采集（GET /api/stats/collect）
// 四站统一埋点入口：页面加载与心跳各打一次（1×1 像素响应）
// 参数：v=访客ID（浏览器 localStorage 生成） s=站点 portal|moyun|shicang|agent
//       hb=1 心跳（只刷新在线窗口，不计浏览量）
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { statCollect } from "@/lib/stats";

export const dynamic = "force-dynamic";

// 1×1 透明 GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const vid = p.get("v") || "";
  const site = p.get("s") || "moyun";
  const hb = p.get("hb") === "1";
  if (vid) await statCollect(site, vid, hb);
  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
