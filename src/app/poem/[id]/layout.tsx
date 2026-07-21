// ============================================================
// 诗词详情页 · 服务端布局（仅用于生成 SEO / 分享 OG 元信息）
// 客户端页面在 page.tsx；此布局只透传 children 并注入 metadata。
// ============================================================
import type { Metadata } from "next";
import { getKv } from "@/lib/kv";
import type { Poem } from "@/types/poem";

export const runtime = "nodejs";

async function getPoem(id: string): Promise<Poem | null> {
  try {
    const kv = await getKv();
    if (!kv) return null;
    const poems = (await kv.get<Poem[]>("poems:all")) || [];
    return poems.find((p) => p.id === id && !p.deletedAt) || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const poem = await getPoem(id);
  if (!poem) {
    return { title: "诗词" };
  }
  const authorLine = poem.author
    ? `${poem.author}${poem.dynasty ? "·" + poem.dynasty : ""}`
    : "佚名";
  const title = `《${poem.title}》 — ${authorLine}`;
  const desc =
    poem.content.replace(/\s+/g, " ").slice(0, 90) +
    (poem.content.length > 90 ? "…" : "");
  // 封面优先用 AI 配图（http(s) 才对爬虫有效；dataURL/空则回退站点图）
  const cover =
    poem.coverImage && /^https?:\/\//.test(poem.coverImage)
      ? poem.coverImage
      : "/icons/icon-512.svg";
  return {
    title,
    description: desc,
    openGraph: {
      title: `${title} | 墨韵阁`,
      description: desc,
      type: "article",
      images: [{ url: cover }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | 墨韵阁`,
      description: desc,
      images: [cover],
    },
  };
}

export default function PoemDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
