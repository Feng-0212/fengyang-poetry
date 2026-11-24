// ============================================================
// 四时墨苑 - 导航栏（含搜索；移动端为汉堡下拉菜单）
// ============================================================
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSolarTerm } from "@/hooks/useSolarTerm";
import { useSearch } from "@/components/layout/ClientShell";
import { usePasswordGate } from "@/components/auth/PasswordGate";
import SealStamp from "@/components/seals/SealStamp";
import { cn } from "@/lib/utils";

const NAV_LINKS: { href: string; label: string; prefetch?: boolean }[] = [
  { href: "/yuan/sishi-moyuan", label: "四时墨苑" },
  { href: "/chain", label: "飞花令", prefetch: false }, // 低频页，不预取
  { href: "/search", label: "搜索" },
  { href: "/settings", label: "设置" },
];

/* 诗藏家族互链（新窗口打开，不参与当前页高亮） */
const FAMILY_LINKS: { href: string; label: string; title: string }[] = [
  { href: "https://shicang.poeagent.top", label: "诗藏书库", title: "诗藏 · 93 万首诗词数据库" },
  { href: "https://agent.poeagent.top", label: "AI 问答", title: "诗藏 AI 问答 · 有引必答" },
];

export default function Navbar() {
  const pathname = usePathname();
  const solarTerm = useSolarTerm();
  const { openSearch } = useSearch();
  const { user, logout } = usePasswordGate();
  const [menuOpen, setMenuOpen] = useState(false);

  /* 路由变化时自动收起移动菜单 */
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="navbar pt-safe">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="transition-transform group-hover:scale-105">
            <SealStamp term="墨" size="sm" color="#C14A3F" animated={false} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-[var(--font-mashan)] text-lg text-ink-dark tracking-wide">
              墨韵阁
            </span>
            <span className="text-xs text-ink-light tracking-widest">
              MO YUN GE
            </span>
          </div>
        </Link>

        {/* 当前节气标签 */}
        <div className="hide-mobile flex items-center gap-2 text-sm flex-shrink-0">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: solarTerm.color }}
          />
          <span
            className="text-ink-light transition-colors"
            style={{ color: solarTerm.color }}
          >
            {solarTerm.name}
          </span>
        </div>

        {/* 中间：搜索框 */}
        <div className="hide-mobile flex-1 max-w-xs flex items-center gap-2">
          <Link
            href="/search"
            className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink/5 hover:bg-ink/8 transition-colors text-sm text-ink-light"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="flex-1 text-left">搜索诗词...</span>
          </Link>
          <button
            onClick={openSearch}
            className="text-[10px] px-1.5 py-1.5 rounded border border-ink/10 text-ink-light hover:bg-ink/5"
            title="快速搜索 ⌘K"
            aria-label="打开快速搜索"
          >
            ⌘K
          </button>
        </div>

        {/* 右侧：导航链接 + 用户区 */}
        <div className="flex items-center gap-4 md:gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={link.prefetch ?? true}
              className={cn(
                "nav-link hide-mobile",
                (pathname === link.href || (link.href === "/search" && pathname?.startsWith("/search"))) && "text-ink-dark font-medium"
              )}
            >
              {link.label}
            </Link>
          ))}

          {/* 家族导航：诗藏家族互链（门户 poeagent.top） */}
          <a
            href="https://shicang.poeagent.top"
            target="_blank"
            rel="noopener"
            className="nav-link hide-mobile"
            title="诗藏 · 93 万首诗词数据库"
          >
            诗藏书库
          </a>
          <a
            href="https://agent.poeagent.top"
            target="_blank"
            rel="noopener"
            className="nav-link hide-mobile"
            title="诗藏 AI 问答 · 有引必答"
          >
            AI 问答
          </a>

          {/* 移动端：汉堡菜单按钮（桌面隐藏） */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="hide-desktop flex-shrink-0 w-9 h-9 rounded-lg border border-ink/10 items-center justify-center text-ink-dark transition-colors hover:bg-ink/5"
            aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>

          {/* 用户区 */}
          {user ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className="inline-flex items-center gap-1.5 text-sm text-ink-dark"
                title={user.email}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
                  style={{ backgroundColor: "#C14A3F" }}
                >
                  {user.name.slice(0, 1)}
                </span>
                <span className="hide-mobile max-w-[6rem] truncate">{user.name}</span>
              </span>
              <button
                onClick={() => logout()}
                className="text-xs px-2.5 py-1 rounded-full text-ink-light hover:bg-ink/5 border border-ink/10 transition-colors"
                title="退出登录"
              >
                退出
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white transition-all hover:opacity-90"
              style={{ backgroundColor: "#C14A3F" }}
            >
              登录 / 注册
            </Link>
          )}
        </div>
      </div>

      {/* 移动端下拉菜单（桌面隐藏） */}
      {menuOpen && (
        <div className="hide-desktop border-t border-ink/8 bg-[color:var(--card-bg,#fbf8f1)] shadow-ink">
          <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col">
            {NAV_LINKS.map((link) => {
              const active =
                pathname === link.href ||
                (link.href === "/search" && pathname?.startsWith("/search"));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={link.prefetch ?? true}
                  className={cn(
                    "flex items-center justify-between px-3 py-3 rounded-lg text-[15px] transition-colors",
                    active ? "bg-cinnabar/8 text-cinnabar font-medium" : "text-ink-dark hover:bg-ink/5"
                  )}
                >
                  {link.label}
                  {active && <span className="text-xs text-cinnabar/70">当前页</span>}
                </Link>
              );
            })}
            <div className="my-1 h-px bg-ink/8" />
            {FAMILY_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener"
                title={link.title}
                className="flex items-center justify-between px-3 py-3 rounded-lg text-[15px] text-ink-dark hover:bg-ink/5 transition-colors"
              >
                {link.label}
                <span className="text-xs text-ink-light/60">↗</span>
              </a>
            ))}
            {/* 节气点缀（与桌面端一致的小细节） */}
            <div className="flex items-center gap-2 px-3 pt-2 pb-1 text-xs text-ink-light/70">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: solarTerm.color }} />
              {solarTerm.name} · 四时墨苑
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
