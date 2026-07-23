// ============================================================
// 主题 Provider（暗色模式 + 字号调节）
// 状态持久化到 localStorage，应用到 <html> 的 data-theme 与 --font-scale
// ============================================================
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  fontSize: number; // 0.85 ~ 1.4，默认 1
  setTheme: (t: ThemeMode) => void;
  setFontSize: (s: number) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "system" as ThemeMode,
      resolvedTheme: "light" as const,
      fontSize: 1,
      setTheme: () => {},
      setFontSize: () => {},
    };
  }
  return ctx;
}

const THEME_KEY = "moyun-theme";
const FONT_KEY = "moyun-font-scale";

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.setAttribute("data-theme", isDark ? "dark" : "light");
}

function applyFont(scale: number) {
  document.documentElement.style.setProperty("--font-scale", String(scale));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    "light"
  );
  const [fontSize, setFontSizeState] = useState(1);

  // 初始化（读取 localStorage）
  useEffect(() => {
    const savedTheme = (localStorage.getItem(THEME_KEY) as ThemeMode) || "system";
    const savedFont = parseFloat(localStorage.getItem(FONT_KEY) || "1") || 1;
    setThemeState(savedTheme);
    setFontSizeState(savedFont);
    applyFont(savedFont);

    const updateResolved = () => {
      const isDark =
        savedTheme === "dark" ||
        (savedTheme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      setResolvedTheme(isDark ? "dark" : "light");
      applyTheme(savedTheme);
    };
    updateResolved();

    // 跟随系统主题变化
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", updateResolved);
    return () => mq.removeEventListener("change", updateResolved);
  }, []);

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    const isDark =
      t === "dark" ||
      (t === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setResolvedTheme(isDark ? "dark" : "light");
    applyTheme(t);
  };

  const setFontSize = (s: number) => {
    const clamped = Math.min(1.4, Math.max(0.85, s));
    setFontSizeState(clamped);
    localStorage.setItem(FONT_KEY, String(clamped));
    applyFont(clamped);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, fontSize, setTheme, setFontSize }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
