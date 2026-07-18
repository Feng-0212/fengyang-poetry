// ============================================================
// 四时墨苑 - 导航栏（含搜索）
// ============================================================
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSolarTerm } from "@/hooks/useSolarTerm";
import { useSearch } from "@/components/layout/ClientShell";
import SealStamp from "@/components/seals/SealStamp";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "墨韵阁" },
  { href: "/yuan/sishi-moyuan", label: "四时墨苑" },
  { href: "/search", label: "搜索" },
  { href: "/settings", label: "设置" },
];

export default function Navbar() {
  const pathname = usePathname();
  const solarTerm = useSolarTerm();
  const { openSearch } = useSearch();

  return (
    <nav className="navbar">
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
          >
            ⌘K
          </button>
        </div>

        {/* 右侧：导航链接 */}
        <div className="flex items-center gap-4 md:gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "nav-link hide-mobile",
                (pathname === link.href || (link.href === "/search" && pathname?.startsWith("/search"))) && "text-ink-dark font-medium"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
