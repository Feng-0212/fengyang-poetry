// ============================================================
// 四时墨苑 - 全局客户端壳（管理搜索 Modal）
// ============================================================
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import SearchModal from "@/components/search/SearchModal";
import { PasswordProvider } from "@/components/auth/PasswordGate";

interface SearchContextType {
  openSearch: () => void;
  closeSearch: () => void;
  isSearchOpen: boolean;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    // 在没有 Provider 的情况下安全降级
    return {
      openSearch: () => {},
      closeSearch: () => {},
      isSearchOpen: false,
    };
  }
  return ctx;
}

export default function ClientShell({ children }: { children: ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Cmd/Ctrl + K 全局快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <PasswordProvider>
    <SearchContext.Provider
      value={{
        openSearch: () => setIsSearchOpen(true),
        closeSearch: () => setIsSearchOpen(false),
        isSearchOpen,
      }}
    >
      {children}
      <SearchModal
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </SearchContext.Provider>
  </PasswordProvider>
);
}
