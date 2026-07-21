"use client";

// ============================================================
// Service Worker 注册组件（仅客户端运行）
// ============================================================
import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[SW] 注册成功，版本:", registration.active?.scriptURL || "unknown");
          })
          .catch((error) => {
            console.warn("[SW] 注册失败:", error);
          });
      });
    }
  }, []);

  return null;
}
