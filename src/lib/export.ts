// ============================================================
// 诗词导出工具（Markdown / TXT / 打印 PDF）
// ============================================================
import type { Poem } from "@/types/poem";

/** 单首诗词 → Markdown */
export function poemToMarkdown(
  poem: Poem,
  opts?: { collectionName?: string; includeAnnotation?: boolean }
): string {
  const lines: string[] = [];
  lines.push(`## ${poem.title || "无题"}`);

  const meta: string[] = [];
  if (poem.author) meta.push(`**作者**：${poem.author}`);
  if (poem.dynasty) meta.push(`**朝代**：${poem.dynasty}`);
  if (opts?.collectionName) meta.push(`**藏**：${opts.collectionName}`);
  if (poem.tags && poem.tags.length > 0) {
    meta.push(`**标签**：${poem.tags.join("、")}`);
  }
  if (meta.length > 0) lines.push(meta.join("　"));

  lines.push("");
  // 内容：保留换行
  lines.push(poem.content || "");
  lines.push("");

  if (opts?.includeAnnotation && poem.aiCommentary) {
    lines.push(`> ${poem.aiCommentary.replace(/\n/g, "\n> ")}`);
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  return lines.join("\n");
}

/** 单首诗词 → 纯文本 */
export function poemToTxt(
  poem: Poem,
  opts?: { collectionName?: string }
): string {
  const lines: string[] = [];
  lines.push(poem.title || "无题");
  const meta: string[] = [];
  if (poem.author) meta.push(`作者：${poem.author}`);
  if (poem.dynasty) meta.push(`朝代：${poem.dynasty}`);
  if (opts?.collectionName) meta.push(`藏：${opts.collectionName}`);
  if (poem.tags && poem.tags.length > 0) meta.push(`标签：${poem.tags.join("、")}`);
  if (meta.length > 0) lines.push(meta.join("　"));
  lines.push("");
  lines.push(poem.content || "");
  lines.push("");
  lines.push("——————————");
  lines.push("");
  return lines.join("\n");
}

/** 生成完整 Markdown 文档 */
export function buildMarkdown(
  poems: Poem[],
  title: string,
  collections?: { id: string; name: string }[]
): string {
  const collMap = new Map((collections || []).map((c) => [c.id, c.name]));
  const header = `# ${title}\n\n> 共 ${poems.length} 首 · 导出于 ${new Date().toLocaleDateString(
    "zh-CN"
  )}\n\n---\n\n`;
  const body = poems
    .map((p) =>
      poemToMarkdown(p, {
        collectionName: collMap.get(p.collectionId),
        includeAnnotation: true,
      })
    )
    .join("\n");
  return header + body;
}

/** 触发浏览器下载文本文件 */
export function downloadText(
  filename: string,
  content: string,
  mime = "text/plain;charset=utf-8"
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 导出 Markdown（下载 .md） */
export function exportMarkdown(
  poems: Poem[],
  title = "墨韵阁诗词集",
  collections?: { id: string; name: string }[]
): void {
  const content = buildMarkdown(poems, title, collections);
  const safe = title.replace(/[\\/:*?"<>|]/g, "_");
  downloadText(`${safe}.md`, content, "text/markdown;charset=utf-8");
}

/** 导出纯文本（下载 .txt） */
export function exportTxt(
  poems: Poem[],
  title = "墨韵阁诗词集",
  collections?: { id: string; name: string }[]
): void {
  const collMap = new Map((collections || []).map((c) => [c.id, c.name]));
  const header = `${title}\n共 ${poems.length} 首 · 导出于 ${new Date().toLocaleDateString(
    "zh-CN"
  )}\n==============================\n\n`;
  const body = poems
    .map((p) => poemToTxt(p, { collectionName: collMap.get(p.collectionId) }))
    .join("\n");
  const safe = title.replace(/[\\/:*?"<>|]/g, "_");
  downloadText(`${safe}.txt`, header + body, "text/plain;charset=utf-8");
}

/** 打印为 PDF（新窗口 + 浏览器打印） */
export function printPoems(
  poems: Poem[],
  title: string,
  collections?: { id: string; name: string }[]
): void {
  const collMap = new Map((collections || []).map((c) => [c.id, c.name]));
  const escapeHtml = (s: string) =>
    (s || "").replace(/[&<>]/g, (c) =>
      c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"
    );

  const items = poems
    .map((p) => {
      const meta: string[] = [];
      if (p.author) meta.push(`作者：${escapeHtml(p.author)}`);
      if (p.dynasty) meta.push(`朝代：${escapeHtml(p.dynasty)}`);
      const coll = collMap.get(p.collectionId);
      if (coll) meta.push(`藏：${escapeHtml(coll)}`);
      if (p.tags && p.tags.length) meta.push(`标签：${escapeHtml(p.tags.join("、"))}`);
      return `<div class="poem">
  <h2>${escapeHtml(p.title || "无题")}</h2>
  ${meta.length ? `<div class="meta">${meta.join("　")}</div>` : ""}
  <div class="content">${escapeHtml(p.content)
        .split("\n")
        .map((l) => `<p>${l || "&nbsp;"}</p>`)
        .join("")}</div>
  ${
    p.aiCommentary
      ? `<div class="anno">${escapeHtml(p.aiCommentary)
          .split("\n")
          .map((l) => `<p>${l}</p>`)
          .join("")}</div>`
      : ""
  }
</div>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body{font-family:"Noto Serif SC","Songti SC",serif;color:#1a1a1a;max-width:720px;margin:40px auto;padding:0 24px;line-height:1.9;}
  h1{text-align:center;font-family:"Ma Shan Zheng",serif;}
  .poem{margin:28px 0;padding-bottom:20px;border-bottom:1px solid #eee;}
  h2{font-size:20px;margin:0 0 6px;}
  .meta{color:#888;font-size:13px;margin-bottom:8px;}
  .content p{margin:2px 0;white-space:pre-wrap;}
  .anno{margin-top:10px;padding-left:12px;border-left:2px solid #C14A3F;color:#666;font-size:14px;}
  @media print{body{margin:0;}.poem{page-break-inside:avoid;}}
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<p style="text-align:center;color:#999;font-size:13px;">共 ${poems.length} 首 · 导出于 ${new Date().toLocaleDateString(
    "zh-CN"
  )}</p>
${items}
<script>window.onload=function(){setTimeout(function(){window.print();},300);};</script>
</body></html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
  } else {
    // 弹窗被拦截时的兜底：直接下载 HTML
    downloadText(
      `${title.replace(/[\\/:*?"<>|]/g, "_")}.html`,
      html,
      "text/html;charset=utf-8"
    );
  }
}
