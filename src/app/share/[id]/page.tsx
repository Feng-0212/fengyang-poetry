// ============================================================
// 分享公开页（/share/[id]）— 无鉴权只读展示单首诗词
// 用途：生成公开链接，微信/QQ/群内直接打开欣赏，无需登录
// ============================================================
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getKv } from "@/lib/kv";
import { getSolarTermMeta } from "@/lib/solarterms";
import type { Poem, Collection } from "@/types/poem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getPoemWithCollection(
  id: string
): Promise<{ poem: Poem; collection?: Collection } | null> {
  try {
    const kv = await getKv();
    if (!kv) return null;
    const poems = (await kv.get<Poem[]>("poems:all")) || [];
    const poem = poems.find((p) => p.id === id && !p.deletedAt);
    if (!poem) return null;
    const collections = (await kv.get<Collection[]>("collections:all")) || [];
    const collection = collections.find((c) => c.id === poem.collectionId);
    return { poem, collection };
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
  const data = await getPoemWithCollection(id);
  if (!data) return { title: "诗词分享 | 墨韵阁" };
  const { poem } = data;
  const authorLine = poem.author
    ? `${poem.author}${poem.dynasty ? "·" + poem.dynasty : ""}`
    : "佚名";
  const title = `《${poem.title}》 — ${authorLine}`;
  const desc =
    poem.content.replace(/\s+/g, " ").slice(0, 100) +
    (poem.content.length > 100 ? "…" : "");
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

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPoemWithCollection(id);
  if (!data) notFound();

  const { poem, collection } = data;
  const authorLine = poem.author
    ? `${poem.author}${poem.dynasty ? "·" + poem.dynasty : ""}`
    : "佚名";
  const termMeta = poem.solarTerm ? getSolarTermMeta(poem.solarTerm) : null;

  return (
    <main className="paper-texture min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="bg-white/70 backdrop-blur rounded-2xl border border-ink/10 shadow-ink overflow-hidden">
          {/* 封面 */}
          {poem.coverImage && (
            <div className="relative aspect-video w-full">
              <Image
                src={poem.coverImage}
                alt={poem.title}
                fill
                sizes="(max-width: 768px) 100vw, 576px"
                className="object-cover"
              />
            </div>
          )}

          {/* 正文 */}
          <div className="p-8">
            {collection && (
              <p className="text-xs text-ink-light mb-3 tracking-widest text-center">
                {collection.name}
                {collection.subname ? ` · ${collection.subname}` : ""}
              </p>
            )}
            <h1 className="font-[var(--font-mashan)] text-3xl text-ink-dark text-center mb-2">
              {poem.title}
            </h1>
            <p className="text-sm text-ink-light text-center mb-6">
              {authorLine}
              {termMeta ? ` · ${termMeta.name}` : ""}
            </p>
            <pre className="whitespace-pre-wrap font-[var(--font-lxgw)] text-lg leading-loose text-ink text-center mb-6">
              {poem.content}
            </pre>

            {/* 标签 */}
            {poem.tags && poem.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {poem.tags.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full bg-cinnabar/8 text-cinnabar text-xs border border-cinnabar/15"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* AI 赏析 */}
            {poem.aiCommentary && (
              <div className="mt-6 p-4 rounded-xl bg-ink/3 border border-ink/8">
                <p className="text-xs text-ink-light mb-2 tracking-widest">
                  AI 赏析
                </p>
                <p className="text-sm text-ink leading-relaxed">
                  {poem.aiCommentary}
                </p>
              </div>
            )}

            {/* 页脚 */}
            <div className="mt-8 pt-4 border-t border-ink/8 flex items-center justify-between">
              <span className="text-xs text-ink-light">来自墨韵阁</span>
              <Link
                href="/"
                className="text-xs text-cinnabar hover:opacity-80 transition-opacity"
              >
                收藏你的诗 →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
