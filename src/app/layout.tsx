// ============================================================
// 四时墨苑 - 根布局
// ============================================================
import type { Metadata, Viewport } from "next";
import ClientShell from "@/components/layout/ClientShell";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F0E8" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1A1A" },
  ],
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://poetry-garden.vercel.app"
  ),
  title: {
    default: "墨韵阁",
    template: "%s | 墨韵阁",
  },
  description: "四时有墨，苑藏诗意。一座随节气流转的私人诗词园林。",
  keywords: ["诗词", "二十四节气", "水墨", "古籍", "诗意", "墨韵阁"],
  authors: [{ name: "墨韵阁" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "墨韵阁",
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="墨韵阁" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='4' fill='%23C14A3F'/><text x='16' y='23' text-anchor='middle' font-size='20' fill='white' font-family='serif'>墨</text></svg>"
        />
      </head>
      <body className="paper-texture antialiased">
        <ClientShell>{children}</ClientShell>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
