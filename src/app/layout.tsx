// ============================================================
// 四时墨苑 - 根布局
// ============================================================
import type { Metadata } from "next";
import ClientShell from "@/components/layout/ClientShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "四时墨苑 — 二十四节气诗词收藏",
  description: "四时有墨，苑藏诗意。一座随节气流转的私人诗词园林。",
  keywords: ["诗词", "二十四节气", "水墨", "古籍", "诗意", "四时墨苑"],
  authors: [{ name: "四时墨苑" }],
  openGraph: {
    title: "四时墨苑",
    description: "四时有墨，苑藏诗意",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='4' fill='%23C14A3F'/><text x='16' y='23' text-anchor='middle' font-size='20' fill='white' font-family='serif'>墨</text></svg>"
        />
      </head>
      <body className="paper-texture antialiased">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
