// ============================================================
// 设置页 · 标签管理器（重命名 / 合并 / 删除）
// ============================================================
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllPoems } from "@/lib/api";
import { updatePoem } from "@/lib/api";
import type { Poem } from "@/types/poem";

interface TagStat {
  tag: string;
  count: number;
}

interface Props {
  requirePassword: (cb: () => void | Promise<void>) => void;
  onDone: () => void;
  accentColor?: string;
}

export default function TagManager({
  requirePassword,
  onDone,
  accentColor = "#C14A3F",
}: Props) {
  const [tagStats, setTagStats] = useState<TagStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Record<string, "rename" | "merge" | null>>({});
  const [renameInput, setRenameInput] = useState<Record<string, string>>({});
  const [mergeTarget, setMergeTarget] = useState<string>("");
  const [operating, setOperating] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const ps = await getAllPoems();
        const counts: Record<string, number> = {};
        ps.forEach((p) => (p.tags || []).forEach((t) => {
          counts[t] = (counts[t] || 0) + 1;
        }));
        setTagStats(
          Object.entries(counts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
        );
      } catch {
        setMsg("加载失败");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const otherTags = (exclude: string) =>
    tagStats.filter((t) => t.tag !== exclude).map((t) => t.tag);

  const op = async (label: string, fn: () => Promise<void>) => {
    setMsg("");
    setOperating(true);
    try {
      await fn();
      setMsg(`✓ ${label} 完成`);
      setMode({});
      setRenameInput({});
      setMergeTarget("");
      onDone();
    } catch (e) {
      setMsg("操作失败：" + (e instanceof Error ? e.message : String(e)));
    } finally {
      setOperating(false);
    }
  };

  const doRename = (oldTag: string) => {
    const newTag = renameInput[oldTag]?.trim();
    if (!newTag || newTag === oldTag) { setMsg("请输入新标签名"); return; }
    requirePassword(async () => {
      await op(`已将「${oldTag}」重命名为「${newTag}」`, async () => {
        const ps = await getAllPoems();
        const toUpdate = ps.filter((p) => (p.tags || []).includes(oldTag));
        await Promise.all(
          toUpdate.map((p) =>
            updatePoem(p.id, {
              tags: [...(p.tags || []).filter((t) => t !== oldTag), newTag],
            })
          )
        );
      });
    });
  };

  const doMerge = (fromTag: string) => {
    const toTag = mergeTarget;
    if (!toTag) { setMsg("请选择目标标签"); return; }
    requirePassword(async () => {
      await op(`已将「${fromTag}」合并到「${toTag}」`, async () => {
        const ps = await getAllPoems();
        const toUpdate = ps.filter(
          (p) =>
            (p.tags || []).includes(fromTag) &&
            !(p.tags || []).includes(toTag)
        );
        await Promise.all(
          toUpdate.map((p) =>
            updatePoem(p.id, {
              tags: [...(p.tags || []).filter((t) => t !== fromTag), toTag],
            })
          )
        );
      });
    });
  };

  const doDelete = (tag: string) => {
    requirePassword(async () => {
      await op(`已删除标签「${tag}」`, async () => {
        const ps = await getAllPoems();
        const toUpdate = ps.filter((p) => (p.tags || []).includes(tag));
        await Promise.all(
          toUpdate.map((p) =>
            updatePoem(p.id, {
              tags: (p.tags || []).filter((t) => t !== tag),
            })
          )
        );
      });
    });
  };

  if (loading) return <div className="text-sm text-ink-light py-4 text-center">加载标签...</div>;

  return (
    <div>
      {tagStats.length === 0 ? (
        <p className="text-sm text-ink-light/60 py-6 text-center">
          还没有标签
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {tagStats.map(({ tag, count }) => (
            <div
              key={tag}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-ink/4 transition-colors"
            >
              <span
                className="text-sm px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${accentColor}15`,
                  color: accentColor,
                  fontFamily: "var(--font-lxgw)",
                }}
              >
                #{tag}
              </span>
              <span className="text-xs text-ink-light">×{count}</span>

              {/* 展开操作行 */}
              <div className="flex-1" />

              {operating ? (
                <span className="text-xs text-ink-light animate-pulse">处理中...</span>
              ) : mode[tag] === "rename" ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={renameInput[tag] || ""}
                    onChange={(e) =>
                      setRenameInput((p) => ({ ...p, [tag]: e.target.value }))
                    }
                    placeholder={`新标签名`}
                    className="w-24 px-2 py-1 text-sm rounded border border-ink/15 outline-none focus:border-cinnabar/40"
                  />
                  <button
                    onClick={() => doRename(tag)}
                    className="text-xs px-2 py-1 rounded bg-cinnabar text-white hover:opacity-85"
                  >
                    确认
                  </button>
                  <button
                    onClick={() => setMode((p) => ({ ...p, [tag]: null }))}
                    className="text-xs px-2 py-1 rounded border border-ink/15 text-ink-light"
                  >
                    取消
                  </button>
                </div>
              ) : mode[tag] === "merge" ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-ink-light">合并到</span>
                  <select
                    value={mergeTarget}
                    onChange={(e) => setMergeTarget(e.target.value)}
                    className="w-28 px-2 py-1 text-sm rounded border border-ink/15 outline-none"
                  >
                    <option value="">选目标标签</option>
                    {otherTags(tag).map((t) => (
                      <option key={t} value={t}>
                        #{t}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => doMerge(tag)}
                    className="text-xs px-2 py-1 rounded bg-cinnabar text-white hover:opacity-85"
                  >
                    确认
                  </button>
                  <button
                    onClick={() => setMode((p) => ({ ...p, [tag]: null }))}
                    className="text-xs px-2 py-1 rounded border border-ink/15 text-ink-light"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setMode((p) => ({ ...p, [tag]: "rename" }))
                    }
                    className="text-xs px-2 py-1 rounded border border-ink/10 text-ink-light hover:border-cinnabar/30 hover:text-cinnabar transition-colors"
                  >
                    重命名
                  </button>
                  {otherTags(tag).length > 0 && (
                    <button
                      onClick={() => setMode((p) => ({ ...p, [tag]: "merge" }))}
                      className="text-xs px-2 py-1 rounded border border-ink/10 text-ink-light hover:border-cinnabar/30 hover:text-cinnabar transition-colors"
                    >
                      合并
                    </button>
                  )}
                  <button
                    onClick={() => doDelete(tag)}
                    className="text-xs px-2 py-1 rounded border border-red-500/20 text-red-400/70 hover:border-red-500/50 hover:text-red-400 transition-colors"
                  >
                    删除
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {msg && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-xs text-center"
          style={{ color: msg.startsWith("✓") ? "#4ade80" : "#f87171" }}
        >
          {msg}
        </motion.p>
      )}
    </div>
  );
}
