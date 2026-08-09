// ============================================================
// 评论区（诗词详情页）
// 公开可读；登录可发（≤500 字）；本人或诗作者可删
// ============================================================
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getComments, addComment, deleteComment } from "@/lib/api";
import { usePasswordGate } from "@/components/auth/PasswordGate";
import { formatRelativeTime } from "@/lib/utils";
import type { PoemComment } from "@/types/poem";
import { m as motion, AnimatePresence } from "framer-motion";

interface Props {
  poemId: string;
  poemOwnerId?: string;
}

export default function CommentSection({ poemId, poemOwnerId }: Props) {
  const { user, requirePassword } = usePasswordGate();
  const [comments, setComments] = useState<PoemComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getComments(poemId)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [poemId]);

  const handleSubmit = () => {
    if (!content.trim()) return;
    requirePassword(async () => {
      setSubmitting(true);
      setError("");
      try {
        const c = await addComment(poemId, content.trim());
        setComments((list) => [...list, c]);
        setContent("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "评论失败");
      } finally {
        setSubmitting(false);
      }
    });
  };

  const handleDelete = (cid: string) => {
    requirePassword(async () => {
      try {
        await deleteComment(poemId, cid);
        setComments((list) => list.filter((c) => c.id !== cid));
      } catch {
        /* 忽略 */
      }
    });
  };

  return (
    <div className="mt-10 pt-6 border-t border-ink/8">
      <h3 className="font-[var(--font-mashan)] text-lg text-ink-dark mb-4">
        评诗 · {comments.length}
      </h3>

      {/* 输入框 */}
      {user ? (
        <div className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 500))}
            placeholder="写下你的点评（最多 500 字）..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-ink/12 bg-white/60 text-sm outline-none focus:border-cinnabar/40 transition-colors resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-ink-light/50">{content.length}/500</span>
            <button
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className="px-4 py-1.5 rounded-full text-xs text-white transition-all disabled:opacity-40"
              style={{ backgroundColor: "#C14A3F" }}
            >
              {submitting ? "发表中..." : "发表点评"}
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
      ) : (
        <p className="text-sm text-ink-light/60 mb-6">
          <Link href="/login" className="text-cinnabar hover:underline">登录</Link>
          {" "}后可发表点评
        </p>
      )}

      {/* 评论列表 */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-ink-light/50 py-6 text-center">
          暂无点评，做第一个评诗的人吧
        </p>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {comments.map((c) => {
              const canDelete = user && (c.userId === user.id || c.userId === poemOwnerId);
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="flex gap-3"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-white flex-shrink-0"
                    style={{ backgroundColor: "#C14A3F", opacity: 0.85 }}
                  >
                    {c.userName.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <Link
                        href={`/u/${c.userId}`}
                        className="text-xs font-medium text-ink-dark hover:text-cinnabar transition-colors"
                      >
                        @{c.userName}
                      </Link>
                      <span className="text-[10px] text-ink-light/50">
                        {formatRelativeTime(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
                      {c.content}
                    </p>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-[10px] text-ink-light/40 hover:text-red-400 transition-colors flex-shrink-0 self-start"
                      title="删除评论"
                    >
                      删除
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
