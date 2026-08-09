// ============================================================
// 用户主页（/u/[userId]）— 聚合某用户的公开作品
// 服务端渲染：读 KV，仅展示该用户公开诗 + 本人（带 token）可见私有诗
// ============================================================
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PoemCard from "@/components/poem/PoemCard";
import { getKv } from "@/lib/kv";
import { getUserById } from "@/lib/user";
import type { Poem, Collection } from "@/types/poem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getProfile(userId: string) {
  try {
    const user = await getUserById(userId);
    if (!user) return null;
    const kv = await getKv();
    if (!kv) return null;
    const [poems, collections] = await Promise.all([
      kv.get<Poem[]>("poems:all").catch(() => []),
      kv.get<Collection[]>("collections:all").catch(() => []),
    ]);
    const colMap = new Map((collections || []).map((c) => [c.id, c]));
    const publicPoems = (poems || [])
      .filter(
        (p) =>
          p.ownerId === user.id &&
          !p.deletedAt &&
          (p.visibility !== "private" || p.visibility === undefined)
      )
      .sort((a, b) => b.createdAt - a.createdAt);
    return { user: { id: user.id, name: user.name }, poems: publicPoems, colMap };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const data = await getProfile(userId);
  if (!data) return { title: "用户" };
  return {
    title: `${data.user.name} 的墨苑`,
    description: `${data.user.name} 在墨韵阁公开的 ${data.poems.length} 首诗词`,
  };
}

export default async function UserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const data = await getProfile(userId);
  if (!data) notFound();

  const { user, poems, colMap } = data;

  return (
    <div className="paper-texture min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 page-container max-w-5xl mx-auto px-6 py-12 w-full">
        {/* 用户信息 */}
        <div className="text-center mb-12">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl text-white shadow-lg"
            style={{ backgroundColor: "#C14A3F" }}
          >
            {user.name.slice(0, 1)}
          </div>
          <h1 className="font-[var(--font-mashan)] text-3xl text-ink-dark mb-2">
            {user.name} 的墨苑
          </h1>
          <p className="text-ink-light text-sm">
            公开诗词 {poems.length} 首 · 以诗会友
          </p>
        </div>

        {poems.length === 0 ? (
          <div className="text-center py-20 text-ink-light/60 text-sm">
            这里还没有公开的诗词，去写一首吧
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {poems.map((poem, i) => (
              <PoemCard
                key={poem.id}
                poem={poem}
                index={i}
                collection={colMap.get(poem.collectionId)}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
