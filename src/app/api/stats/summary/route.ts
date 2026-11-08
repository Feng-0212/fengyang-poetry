// ============================================================
// API: 访问统计汇总（GET /api/stats/summary）
// 权限：仅站点管理员（ADMIN_EMAIL 匹配的登录用户），
//       或带 ?key=（匹配 STATS_SECRET / CRON_SECRET 环境变量）
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { statSummary } from "@/lib/stats";
import { getSessionUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 门 1：密钥参数
  const key = req.nextUrl.searchParams.get("key") || "";
  const secrets = [process.env.STATS_SECRET, process.env.CRON_SECRET].filter(Boolean);
  if (key && secrets.includes(key)) {
    return NextResponse.json(await statSummary());
  }
  // 门 2：管理员会话（Bearer token）
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (token) {
    try {
      const user = await getSessionUser(token);
      const admins = (process.env.ADMIN_EMAIL || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (user && admins.includes(user.email.toLowerCase())) {
        return NextResponse.json(await statSummary());
      }
    } catch {
      /* 存储抖动按未授权处理 */
    }
  }
  return NextResponse.json(
    {
      error: "forbidden",
      message:
        "仅管理员可查看。请用管理员账号登录后访问 /stats 页，或在 URL 加 ?key=<STATS_SECRET>。",
    },
    { status: 403 }
  );
}
