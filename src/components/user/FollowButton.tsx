// ============================================================
// 关注按钮（用户主页用）
// 未登录点击 → 跳登录页；已登录 toggle 关注
// 挂载时向服务端获取真实关注状态（GET /api/user/[id]/follow）
// ============================================================
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toggleFollow, getFollowStatus } from "@/lib/api";
import { usePasswordGate } from "@/components/auth/PasswordGate";
import { cn } from "@/lib/utils";

interface Props {
  targetUserId: string;
  initialFollowersCount: number;
}

export default function FollowButton({
  targetUserId,
  initialFollowersCount,
}: Props) {
  const router = useRouter();
  const { user, requirePassword } = usePasswordGate();
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [busy, setBusy] = useState(false);
  const isSelf = user?.id === targetUserId;

  // 挂载时（尤其已登录）向服务端获取真实关注状态
  useEffect(() => {
    getFollowStatus(targetUserId)
      .then((res) => {
        setFollowing(res.following);
        setFollowersCount(res.followersCount);
      })
      .catch(() => {});
  }, [targetUserId]);

  if (isSelf || !user) {
    // 自己或未登录：显示粉丝数（未登录时按钮点击引导登录）
    return (
      <button
        onClick={() => {
          if (!user) router.push("/login");
        }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs border transition-all border-ink/15 text-ink-light hover:border-ink/30"
      >
        粉丝 {followersCount}
      </button>
    );
  }

  const handleClick = () => {
    requirePassword(async () => {
      setBusy(true);
      try {
        const res = await toggleFollow(targetUserId);
        setFollowing(res.following);
        setFollowersCount(res.followersCount);
      } catch {
        /* 忽略 */
      } finally {
        setBusy(false);
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={busy}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs border transition-all disabled:opacity-50",
          following
            ? "bg-cinnabar/10 text-cinnabar border-cinnabar/30"
            : "bg-cinnabar text-white border-transparent hover:opacity-90"
        )}
      >
        {following ? "✓ 已关注" : "＋ 关注"}
      </button>
      <span className="text-xs text-ink-light">粉丝 {followersCount}</span>
    </div>
  );
}
