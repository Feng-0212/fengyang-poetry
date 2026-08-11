// ============================================================
// 服务端用户与会话工具（邮箱+密码多用户体系）
// - 密码哈希：crypto.scrypt（Node 内置，无外部依赖），格式 salt:hash
// - 会话：Bearer token 存 Redis `sessions:{token}` → userId，TTL 30 天
// - 数据归属：Poem/Collection 带 ownerId；可见性 public/private
// - 旧数据继承：ADMIN_EMAIL 注册时自动认领无 owner 的历史数据
// ============================================================
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getKv } from "@/lib/kv";
import type { User, Poem, Collection } from "@/types/poem";

export const SESSION_TTL = 60 * 60 * 24 * 30; // 30 天

// ============================================================
// 密码哈希
// ============================================================
export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const candidate = scryptSync(pw, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

/** 去掉敏感字段，返回可下发前端的用户信息 */
export function toPublicUser(u: User): { id: string; email: string; name: string } {
  return { id: u.id, email: u.email, name: u.name };
}

// ============================================================
// 用户 CRUD
// ============================================================
export async function getUserByEmail(email: string): Promise<User | null> {
  const kv = await getKv();
  if (!kv) return null;
  try {
    return await kv.get<User>(`users:byEmail:${email.toLowerCase()}`);
  } catch {
    return null;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  const kv = await getKv();
  if (!kv) return null;
  try {
    return await kv.get<User>(`users:byId:${id}`);
  } catch {
    return null;
  }
}

export async function createUser(
  email: string,
  name: string,
  passwordHash: string
): Promise<User> {
  const kv = await getKv();
  const user: User = {
    id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: email.toLowerCase(),
    name,
    passwordHash,
    createdAt: Date.now(),
  };
  if (kv) {
    await kv.set(`users:byEmail:${user.email}`, user);
    await kv.set(`users:byId:${user.id}`, user);
  }
  return user;
}

// ============================================================
// 会话（Bearer token）
// ============================================================
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const kv = await getKv();
  if (kv) await kv.set(`sessions:${token}`, userId, { ex: SESSION_TTL });
  return token;
}

/**
 * 查会话：返回对应用户；无会话返回 null。
 * 注意：存储故障（限流 429 / 网络抖动）会直接抛出，由调用方区分
 * 「会话失效(401)」与「存储不可用(5xx)」——避免存储一抖就把有效会话
 * 当成已过期，导致用户被莫名登出（客户端会因此清空本地 token）。
 */
export async function getSessionUser(token: string): Promise<User | null> {
  const kv = await getKv();
  if (!kv) throw new Error("KV unavailable");
  const userId = await kv.get<string>(`sessions:${token}`);
  if (!userId) return null;
  return await getUserById(userId);
}

export async function deleteSession(token: string): Promise<void> {
  const kv = await getKv();
  if (kv) await kv.del(`sessions:${token}`);
}

/**
 * 从请求解析当前登录用户。
 * - 成功返回 { user }；失败返回 { error: NextResponse（401） }
 */
export async function requireUser(
  req: NextRequest
): Promise<{ user: User } | { error: NextResponse }> {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return {
      error: NextResponse.json(
        { error: "unauthorized", message: "请先登录后再操作" },
        { status: 401 }
      ),
    };
  }
  try {
    const user = await getSessionUser(token);
    if (!user) {
      return {
        error: NextResponse.json(
          { error: "unauthorized", message: "登录已过期，请重新登录" },
          { status: 401 }
        ),
      };
    }
    return { user };
  } catch (e) {
    // 存储不可用（限流/网络抖动）：返回 503 而非 401，
    // 避免客户端把有效会话误判为已过期而清空本地登录态
    console.error("[auth] 会话校验时存储不可用:", e);
    return {
      error: NextResponse.json(
        { error: "storage-unavailable", message: "存储服务暂时不可用，请稍后重试" },
        { status: 503 }
      ),
    };
  }
}

/** 尽力解析当前用户（读接口用：未登录/存储抖动均返回 null，不报错） */
export async function optionalUser(req: NextRequest): Promise<User | null> {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;
  try {
    return await getSessionUser(token);
  } catch {
    return null; // 读接口降级：按未登录处理（公开内容仍可读）
  }
}

// ============================================================
// 可见性 & 权限
// ============================================================
/** 读者视角：private 仅本人可见；无 owner 的旧数据在继承前保持公开（过渡兼容） */
export function isPoemVisible(poem: Poem, userId?: string): boolean {
  if (!poem.ownerId) return true;
  if (poem.visibility === "private") return poem.ownerId === userId;
  return true;
}

/** 写者视角：仅本人可改 */
export function canModifyPoem(poem: Poem, user: User): boolean {
  if (poem.ownerId) return poem.ownerId === user.id;
  return false; // 无归属的旧数据不允许被任意用户修改（继承给管理员后才有归属）
}

/** 藏同理：仅本人可删（无归属的旧藏不允许删除） */
export function canModifyCollection(col: Collection, user: User): boolean {
  if (col.ownerId) return col.ownerId === user.id;
  return false;
}

// ============================================================
// 旧数据继承（ADMIN_EMAIL）
// ============================================================
/**
 * 管理员注册时认领历史数据（无 ownerId 的诗与藏）。
 * 只执行一次（meta:legacyClaimed 标记），幂等。
 */
export async function claimLegacy(
  adminId: string,
  adminName: string
): Promise<{ poems: number; collections: number }> {
  const kv = await getKv();
  if (!kv) return { poems: 0, collections: 0 };
  try {
    const claimed = await kv.get<string>("meta:legacyClaimed");
    if (claimed) return { poems: 0, collections: 0 };
    const poems = (await kv.get<Poem[]>("poems:all")) || [];
    const cols = (await kv.get<Collection[]>("collections:all")) || [];
    let pc = 0;
    let cc = 0;
    poems.forEach((p) => {
      if (!p.ownerId) {
        p.ownerId = adminId;
        p.ownerName = adminName;
        pc++;
      }
    });
    cols.forEach((c) => {
      if (!c.ownerId) {
        c.ownerId = adminId;
        cc++;
      }
    });
    if (pc || cc) {
      await kv.set("poems:all", poems);
      await kv.set("collections:all", cols);
    }
    await kv.set("meta:legacyClaimed", "1");
    return { poems: pc, collections: cc };
  } catch {
    return { poems: 0, collections: 0 };
  }
}

/** 是否为预留管理员邮箱（环境变量 ADMIN_EMAIL，逗号分隔可多个） */
export function isAdminEmail(email: string): boolean {
  const admins = (process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

// ============================================================
// 关注关系
// follows:{userId} = 我关注的用户 ID 列表
// followers:{userId} = 关注我的用户 ID 列表
// ============================================================
export async function getFollows(userId: string): Promise<string[]> {
  const kv = await getKv();
  if (!kv) return [];
  try {
    return (await kv.get<string[]>(`follows:${userId}`)) || [];
  } catch {
    return [];
  }
}

export async function getFollowers(userId: string): Promise<string[]> {
  const kv = await getKv();
  if (!kv) return [];
  try {
    return (await kv.get<string[]>(`followers:${userId}`)) || [];
  } catch {
    return [];
  }
}

/** 切换关注关系，返回最新状态与粉丝数 */
export async function toggleFollow(
  followerId: string,
  targetId: string
): Promise<{ following: boolean; followersCount: number }> {
  const kv = await getKv();
  if (!kv) return { following: false, followersCount: 0 };
  const follows = await getFollows(followerId);
  const followers = await getFollowers(targetId);
  const already = follows.includes(targetId);
  const nextFollows = already
    ? follows.filter((id) => id !== targetId)
    : [...follows, targetId];
  const nextFollowers = already
    ? followers.filter((id) => id !== followerId)
    : [...followers, followerId];
  await kv.set(`follows:${followerId}`, nextFollows);
  await kv.set(`followers:${targetId}`, nextFollowers);
  return { following: !already, followersCount: nextFollowers.length };
}
