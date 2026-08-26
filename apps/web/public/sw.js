const CACHE_VERSION = "zomer-pwa-v2";
const OFFLINE_URL = "/offline.html";
const CORE_ASSETS = [
  OFFLINE_URL,
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  const cacheableStaticAsset =
    /\.(?:css|js|woff2?|png|jpg|jpeg|webp|avif|svg|ico)$/i.test(url.pathname);
  if (!cacheableStaticAsset) return;
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy)));
        }
        return response;
      });
    }),
  );
});

function sameOriginPath(value) {
  try {
    const url = new URL(value || "/blogs", self.location.origin);
    return url.origin === self.location.origin ? `${url.pathname}${url.search}${url.hash}` : "/blogs";
  } catch {
    return "/blogs";
  }
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = {};
  }
  const url = sameOriginPath(data.url);
  event.waitUntil(
    self.registration.showNotification(data.title || "New blog published", {
      body: data.body || "A new post is ready to read.",
      icon: data.icon || "/web-app-manifest-192x192.png",
      badge: data.badge || "/web-app-manifest-192x192.png",
      tag: data.tag || "blog.published",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetPath = sameOriginPath(event.notification.data?.url);
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
      for (const windowClient of windows) {
        const clientUrl = new URL(windowClient.url);
        if (`${clientUrl.pathname}${clientUrl.search}${clientUrl.hash}` === targetPath) {
          return windowClient.focus();
        }
      }
      const existing = windows[0];
      if (existing) {
        await existing.navigate(targetPath);
        return existing.focus();
      }
      return self.clients.openWindow(targetPath);
    }),
  );
});
