const CACHE_PREFIX = "zomer-pwa-";
const CACHE_VERSION = `${CACHE_PREFIX}v5`;
const OFFLINE_URL = "/offline.html";
const CORE_ASSETS = [
  OFFLINE_URL,
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "/web-app-manifest-maskable-192x192.png",
  "/web-app-manifest-maskable-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
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
    /^\/(?:api|admin)(?:\/|$)/.test(url.pathname)
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => (await caches.open(CACHE_VERSION)).match(OFFLINE_URL)),
    );
    return;
  }

  const fingerprinted = url.pathname.startsWith("/_build/");
  if (!fingerprinted && !CORE_ASSETS.includes(url.pathname)) return;
  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (fingerprinted && response.ok && response.type === "basic") {
        event.waitUntil(cache.put(request, response.clone()));
      }
      return response;
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
