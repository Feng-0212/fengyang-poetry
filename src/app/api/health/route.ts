// ============================================================
// API: 健康检查（/api/health）
// 返回存储模式：redis（已配置持久化）或 memory（进程内存回退）
// 前端设置页据此提示「刷新/重启丢数据」风险
// ============================================================
import { NextResponse } from "next/server";
import { hasPersistentStorage } from "@/lib/kv";

export async function GET() {
  const persistent = hasPersistentStorage();
  return NextResponse.json({
    ok: true,
    storage: persistent ? "redis" : "memory",
    persistent,
  });
}
