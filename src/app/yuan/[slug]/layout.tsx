// ============================================================
// 藏主页 · 服务端布局（仅用于生成 SEO / 分享 OG 元信息）
// 客户端页面在 page.tsx；此布局只透传 children 并注入 metadata。
// ============================================================
import type { Metadata } from "next";
import { getKv } from "@/lib/kv";
import type { Collection } from "@/types/poem";

export const runtime = "nodejs";

async function getCollection(slug: string): Promise<Collection | null> {
  try {
    const kv = await getKv();
    if (!kv) return null;
    const collections = (await kv.get<Collection[]>("collections:all")) || [];
    return collections.find((c) => c.slug === slug) || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) {
    return { title: "藏" };
  }
  const title = `${collection.name}${collection.subname ? " · " + collection.subname : ""}`;
  const desc =
    collection.blurb ||
    `${collection.name}——${collection.subname || "藏诗词、藏时光、藏心意"}`;
  return {
    title,
    description: desc,
    openGraph: {
      title: `${title} | 墨韵阁`,
      description: desc,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${title} | 墨韵阁`,
      description: desc,
    },
  };
}

export default function CollectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
