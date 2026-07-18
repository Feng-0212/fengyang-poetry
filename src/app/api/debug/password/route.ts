// 临时调试端点 - 查看构建时实际注入的密码长度
import { NextResponse } from "next/server";

export async function GET() {
  const pw = process.env.NEXT_PUBLIC_POEM_PASSWORD || "";
  return NextResponse.json({
    length: pw.length,
    firstChar: pw.charAt(0) || "",
    isEmpty: pw === "",
    hint: pw ? "已设置" : "未设置！fallback 应为 'zsklj'",
  });
}
