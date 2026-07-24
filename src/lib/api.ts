// ============================================================
// 服务端 API 客户端 — 共享数据层
// ============================================================
import type { Poem, Collection } from "@/types/poem";
import { PASSWORD_KEY } from "./auth";

const BASE = "/api";

async function apiFetch<T>(
  url: string,
  init?: RequestInit & { requireAuth?: boolean }
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  // 写操作自动带上密码 header（从 localStorage 读）
  if (init?.requireAuth && typeof window !== "undefined") {
    const pw = localStorage.getItem(PASSWORD_KEY) || "";
    if (pw) headers["x-poem-password"] = pw;
  }
  const res = await fetch(`${BASE}${url}`, {
    headers,
    ...init
  });
  // 每次写操作后清除本地存储的密码，下次必须重新输入
  if (init?.method && !["GET", "HEAD", "OPTIONS"].includes(init.method)) {
    if (typeof window !== "undefined") {
      localStorage.removeItem(PASSWORD_KEY);
    }
  }
  if (!res.ok) {
    // 401 = 密码错误，抛特定错误让前端弹窗重输
    if (res.status === 401) {
      const body = await res.json().catch(() => ({}));
      const err = new Error(body.message || "密码错误或未提供");
      (err as any).status = 401;
      throw err;
    }
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

// ============================================================
// 诗词 CRUD（与 db.ts 签名一致，方便替换）
// ============================================================

/** 创建诗词 */
export async function addPoem(
  data: Omit<Poem, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const res = await apiFetch<{ id: string; poem: Poem }>("/poems", {
    method: "POST",
    requireAuth: true,
    body: JSON.stringify(data)
  });
  return res.id;
}

/** 获取全部诗词 */
export async function getAllPoems(): Promise<Poem[]> {
  const res = await apiFetch<{ poems: Poem[] }>("/poems");
  return res.poems.filter((p) => !p.deletedAt)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** 获取全部诗词（包括已软删除的） */
export async function getAllPoemsIncludingDeleted(): Promise<Poem[]> {
  const res = await apiFetch<{ poems: Poem[] }>("/poems");
  return res.poems.sort((a, b) => b.createdAt - a.createdAt);
}

/** 恢复软删除的诗词 */
export async function restorePoem(id: string): Promise<void> {
  await apiFetch(`/poem/${id}`, {
    method: "PUT",
    body: JSON.stringify({ deletedAt: null }),
    requireAuth: true
  });
}

/** 永久删除诗词（从 Redis 物理删除） */
export async function permanentlyDeletePoem(id: string): Promise<void> {
  await apiFetch(`/poem/${id}?permanent=1`, { method: "DELETE", requireAuth: true });
}

/** 获取单首诗词 */
export async function getPoem(id: string): Promise<Poem | null> {
  try {
    const res = await apiFetch<{ poem: Poem }>(`/poem/${id}`);
    return res.poem.deletedAt ? null : res.poem;
  } catch {
    return null;
  }
}

/** 更新诗词 */
export async function updatePoem(
  id: string,
  changes: Partial<Poem>
): Promise<void> {
  await apiFetch(`/poem/${id}`, {
    method: "PUT",
    body: JSON.stringify(changes),
    requireAuth: true
  });
}

/** 删除诗词（软删除） */
export async function deletePoem(id: string): Promise<void> {
  await apiFetch(`/poem/${id}`, { method: "DELETE", requireAuth: true });
}

/** 收藏切换 */
export async function toggleFavorite(id: string): Promise<void> {
  const poem = await getPoem(id);
  if (poem) {
    await updatePoem(id, {
      isFavorite: !poem.isFavorite,
      favoriteCount: poem.isFavorite
        ? Math.max(0, (poem.favoriteCount || 1) - 1)
        : (poem.favoriteCount || 0) + 1
    });
  }
}

/** 删除藏（云端删除该藏下所有诗词） */
export async function deleteCollectionApi(id: string): Promise<void> {
  await apiFetch(`/collection/${id}`, { method: "DELETE", requireAuth: true });
}

/** 获取云端藏列表 */
export async function getCollectionsApi(): Promise<Collection[]> {
  const res = await apiFetch<{ collections: Collection[] }>("/collection");
  return res.collections;
}

/** 创建藏（云端） */
export async function addCollectionApi(
  data: Omit<Collection, "id" | "createdAt" | "updatedAt" | "isSystem">
): Promise<Collection> {
  const res = await apiFetch<{ collection: Collection }>("/collection", {
    method: "POST",
    requireAuth: true,
    body: JSON.stringify(data)
  });
  return res.collection;
}

// ============================================================
// 备份历史 & 批量 AI 标签
// ================================================================

export interface BackupSnapshot {
  date: string;
  poemCount: number;
}

export interface BatchTagResult {
  total: number;
  processed: number;
  tagged: number;
  skipped: number;
  failed: number;
  results: { poemId: string; title: string; tags: string[]; ok: boolean }[];
}

/** 获取快照历史列表 */
export async function getBackupHistory(): Promise<BackupSnapshot[]> {
  const res = await apiFetch<{ history: BackupSnapshot[] }>("/backup/history");
  return res.history;
}

/** 下载指定日期的备份 JSON */
export async function downloadBackup(date: string): Promise<{ poems: Poem[] }> {
  return apiFetch<{ poems: Poem[] }>(`/backup/history?date=${date}&data=1`);
}

/** 触发批量 AI 打标签 */
export async function runBatchAiTags(
  poemIds?: string[]
): Promise<BatchTagResult> {
  return apiFetch<BatchTagResult>("/poems/batch-tags", {
    method: "POST",
    requireAuth: true,
    body: JSON.stringify({ poemIds })
  });
}
