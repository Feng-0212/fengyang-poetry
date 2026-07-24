// ============================================================
// API: 批量 AI 打标签（POST /api/poems/batch-tags）
// Body: { poemIds?: string[] }  // 空或不传 = 处理全部诗
// 对每首诗调用 AI 标签接口，成功后更新 tags 字段
// 返回：{ total, processed, failed, results }
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import type { Poem } from "@/types/poem";
import { checkPassword } from "@/lib/auth";

const KV_KEY = "poems:all";
const MAX_CONCURRENT = 3; // 同时并发 AI 请求数

async function getKv() {
  try {
    const mod = await import("@upstash/redis");
    if (mod.Redis) {
      const url =
        process.env.UPSTASH_REDIS_REST_URL ||
        process.env.KV_REST_API_URL ||
        process.env.REDIS_URL ||
        "";
      const token =
        process.env.UPSTASH_REDIS_REST_TOKEN ||
        process.env.KV_REST_API_TOKEN ||
        "";
      if (url) return new mod.Redis({ url, token });
    }
  } catch {}
  return null;
}

async function getPoems(): Promise<Poem[]> {
  const kv = await getKv();
  if (kv) {
    const data = await kv.get<Poem[]>(KV_KEY);
    return data || [];
  }
  if (!(globalThis as any).__poems) (globalThis as any).__poems = [];
  return (globalThis as any).__poems;
}

async function setPoems(poems: Poem[]): Promise<void> {
  const kv = await getKv();
  if (kv) {
    await kv.set(KV_KEY, poems);
  } else {
    (globalThis as any).__poems = poems;
  }
}

function resolveConfig(req: Request) {
  const h = req.headers;
  return {
    key:
      h.get("x-ai-key") ||
      process.env.AI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      "",
    baseUrl:
      h.get("x-ai-base-url") ||
      process.env.AI_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      "https://api.openai.com/v1",
    model:
      h.get("x-ai-model") ||
      process.env.AI_TEXT_MODEL ||
      "gpt-4o-mini",
  };
}

function parseTags(raw: string): string[] {
  try {
    const trimmed = raw
      .replace(/^[^{]*?(?={)/, "")
      .replace(/<[^>]+>/g, "")
      .trim();
    const h = JSON.parse(trimmed) as { tags?: unknown };
    if (h.tags && Array.isArray(h.tags)) {
      return h.tags
        .slice(0, 3)
        .filter((t): t is string => typeof t === "string" && t.length > 0);
    }
  } catch {}
  return [];
}

async function generateTagsForPoem(
  poem: Poem,
  req: Request
): Promise<{ tags: string[] }> {
  const { key, baseUrl, model } = resolveConfig(req);
  if (!key) return { tags: [] };

  const TAG_POOL = [
    "思乡", "山水", "豪放", "婉约", "田园", "边塞",
    "送别", "怀古", "咏史", "即景", "闺怨", "羁旅",
    "闲适", "隐逸", "哲理", "爱国", "悼亡", "爱情",
    "节令", "饮酒", "读书", "战争", "渔樵", "行旅",
  ];

  const prompt = `你是一位古典诗词鉴赏家。请根据下面这首诗词，从标签池中推荐 2-3 个最贴切的标签。
诗词标题：${poem.title || "无题"}
作者：${poem.author || "佚名"} ${poem.dynasty ? `（${poem.dynasty}）` : ""}
正文：
${poem.content}

标签池：${TAG_POOL.join("、")}
请严格从标签池中选择 2-3 个最贴切的标签，用以下 JSON 格式返回（不要有任何其他内容）：
{"tags":["标签1","标签2","标签3"]}`;

  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 64,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) return { tags: [] };

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content ?? "";
  return { tags: parseTags(raw) };
}

// 并发控制批量处理
async function processWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  const queue = items.entries();
  const workers = Array.from({ length: concurrency }, async () => {
    for (const [i, item] of queue) {
      results[i] = await fn(item);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function POST(req: NextRequest) {
  const authErr = checkPassword(req);
  if (authErr) return authErr;

  try {
    const body = await req.json().catch(() => ({}));
    const targetIds: string[] | undefined = Array.isArray(body.poemIds)
      ? body.poemIds
      : undefined;

    const allPoems = await getPoems();
    // 过滤出需要处理的诗（排除已删除）
    const toProcess = allPoems.filter(
      (p) => !p.deletedAt && (targetIds ? targetIds.includes(p.id) : true)
    );

    if (toProcess.length === 0) {
      return NextResponse.json({ total: 0, processed: 0, failed: 0, results: [] });
    }

    // 已有 AI tags 的诗跳过（除非 tags 为空）
    const needsTagging = toProcess.filter(
      (p) => !p.tags || p.tags.length === 0
    );

    const tagResults = await processWithConcurrency(
      needsTagging,
      MAX_CONCURRENT,
      async (poem) => {
        try {
          const { tags } = await generateTagsForPoem(poem, req);
          return { poemId: poem.id, title: poem.title, tags, ok: tags.length > 0 };
        } catch {
          return { poemId: poem.id, title: poem.title, tags: [], ok: false };
        }
      }
    );

    // 写回 Redis（逐首更新，保持原子性）
    const updatedPoems = await getPoems();
    let writeCount = 0;
    for (const result of tagResults) {
      if (result.ok) {
        const idx = updatedPoems.findIndex((p) => p.id === result.poemId);
        if (idx !== -1) {
          updatedPoems[idx].tags = [
            ...new Set([...(updatedPoems[idx].tags || []), ...result.tags]),
          ].slice(0, 10);
          updatedPoems[idx].updatedAt = Date.now();
          writeCount++;
        }
      }
    }
    await setPoems(updatedPoems);

    return NextResponse.json({
      total: toProcess.length,
      processed: needsTagging.length,
      tagged: tagResults.filter((r) => r.ok).length,
      skipped: toProcess.length - needsTagging.length, // 已有标签跳过的
      failed: tagResults.filter((r) => !r.ok).length,
      results: tagResults,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "batch tag failed" },
      { status: 500 }
    );
  }
}
