// ============================================================
// 墨韵阁 Service Worker
// 策略：静态资源 cache-first，API 网络优先
// ============================================================

const CACHE_NAME = "moyuan-v1";
const STATIC_CACHE = "moyuan-static-v1";
const API_CACHE = "moyuan-api-v1";

// 安装时缓存静态资源
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        "/",
        "/manifest.json",
        "/icons/icon-192.svg",
        "/icons/icon-512.svg",
        "/icons/icon-maskable.svg",
      ]);
    })
  );
  self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 请求拦截
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 请求：网络优先，失败回退缓存
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // 静态资源（字体、图片等）：缓存优先
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/textures/") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff")
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 页面导航：网络优先，支持离线回退
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithOffline(request));
    return;
  }

  // 默认：网络优先
  event.respondWith(networkFirst(request, STATIC_CACHE));
});

// 缓存优先
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("离线状态，该资源不可用", { status: 503 });
  }
}

// 网络优先
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "离线状态" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// 页面导航：网络优先，离线回退首页
async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // 回退到首页缓存
    const indexCached = await caches.match("/");
    if (indexCached) return indexCached;
    return new Response("离线状态，请检查网络连接", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

// 推送通知支持（预留）
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "墨韵阁", {
      body: data.body || "您有一首新诗待赏",
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
      tag: "moyuan-notify",
    })
  );
});
