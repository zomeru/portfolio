const CACHE_VERSION = "v4";
const CACHE_NAMES = {
  core: `zomer-core-${CACHE_VERSION}`,
  navigation: `zomer-navigation-${CACHE_VERSION}`,
  content: `zomer-content-${CACHE_VERSION}`,
  static: `zomer-static-${CACHE_VERSION}`,
};
const MANAGED_CACHE_PREFIXES = [
  "zomer-core-",
  "zomer-navigation-",
  "zomer-content-",
  "zomer-static-",
];
const OFFLINE_URL = "/offline.html";
const CORE_ASSETS = [
  OFFLINE_URL,
  "/manifest.json",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "/web-app-manifest-maskable-192x192.png",
  "/web-app-manifest-maskable-512x512.png",
];
const CACHE_LIMITS = {
  navigation: { maxAgeMs: 7 * 24 * 60 * 60 * 1_000, maxEntries: 48 },
  content: { maxAgeMs: 24 * 60 * 60 * 1_000, maxEntries: 80 },
  static: { maxAgeMs: 365 * 24 * 60 * 60 * 1_000, maxEntries: 180 },
};
const CACHE_TIME_HEADER = "x-zomer-cache-time";
const NAVIGATION_TIMEOUT_MS = 4_000;
const localeRoutePattern = /^\/(?:en|ja|zh-CN|de)(?:\/?|\/(?:ask|blogs(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?|contact|developers|github-contributions|projects(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?|work\/[a-z0-9]+(?:-[a-z0-9]+)*)\/?)$/u;
const searchIndexPattern = /^\/(?:en|ja|zh-CN|de)\/search-index\.json$/u;
const publicGithubPattern = /^\/api\/github\/(?:contributions|commits)$/u;
const sensitivePublicRoutePattern = /^\/(?:en|ja|zh-CN|de)\/blogs\/unsubscribe\/?$/u;

function isPublicLocaleRoute(pathname) {
  return localeRoutePattern.test(pathname) && !sensitivePublicRoutePattern.test(pathname);
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isManagedCache(name) {
  return MANAGED_CACHE_PREFIXES.some((prefix) => name.startsWith(prefix));
}

function cachePrefix(name) {
  return MANAGED_CACHE_PREFIXES.find((prefix) => name.startsWith(prefix));
}

function cacheVersion(name, prefix) {
  const value = Number.parseInt(name.slice(prefix.length).replace(/^v/u, ""), 10);
  return Number.isFinite(value) ? value : -1;
}

async function cleanupOldCaches() {
  const keys = await caches.keys();
  const keep = new Set(Object.values(CACHE_NAMES));
  for (const prefix of MANAGED_CACHE_PREFIXES) {
    const previous = keys
      .filter((key) => key.startsWith(prefix) && !keep.has(key))
      .sort((left, right) => cacheVersion(left, prefix) - cacheVersion(right, prefix))
      .at(-1);
    if (previous) keep.add(previous);
  }
  await Promise.all(
    keys
      .filter((key) => isManagedCache(key) && !keep.has(key))
      .map((key) => caches.delete(key)),
  );
}

function stampedResponse(response) {
  const headers = new Headers(response.headers);
  headers.set(CACHE_TIME_HEADER, String(Date.now()));
  headers.delete("content-length");
  return new Response(response.clone().body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

function isCacheableResponse(response, expectedContentType, cachePublicRoute = false) {
  if (!response.ok || (response.type !== "basic" && response.type !== "cors")) return false;
  const cacheControl = response.headers.get("cache-control") ?? "";
  if (!cachePublicRoute && /\b(?:no-store|private)\b/iu.test(cacheControl)) return false;
  if (!expectedContentType) return true;
  return (response.headers.get("content-type") ?? "").includes(expectedContentType);
}

async function trimCache(cacheName, limits) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const entries = await Promise.all(
    keys.map(async (request) => {
      const response = await cache.match(request);
      return {
        request,
        timestamp: Number(response?.headers.get(CACHE_TIME_HEADER) ?? 0),
      };
    }),
  );
  const expiredBefore = Date.now() - limits.maxAgeMs;
  const expired = entries.filter(
    (entry) => entry.timestamp > 0 && entry.timestamp < expiredBefore,
  );
  const expiredRequests = new Set(expired.map((entry) => entry.request));
  const remaining = entries
    .filter((entry) => !expiredRequests.has(entry.request))
    .sort((left, right) => left.timestamp - right.timestamp);
  const overflow = remaining.slice(0, Math.max(0, remaining.length - limits.maxEntries));
  await Promise.all([...expired, ...overflow].map((entry) => cache.delete(entry.request)));
}

async function putInCache(
  cacheName,
  request,
  response,
  limits,
  expectedContentType,
  cachePublicRoute = false,
) {
  if (!isCacheableResponse(response, expectedContentType, cachePublicRoute)) return;
  const cache = await caches.open(cacheName);
  await cache.put(request, stampedResponse(response));
  await trimCache(cacheName, limits);
}

async function matchManagedCaches(request, currentCacheName, maxAgeMs) {
  const keys = await caches.keys();
  const prefix = cachePrefix(currentCacheName);
  const names = [
    currentCacheName,
    ...keys
      .filter((key) => key !== currentCacheName && prefix && key.startsWith(prefix))
      .sort((left, right) => cacheVersion(left, prefix) - cacheVersion(right, prefix))
      .reverse(),
  ];
  for (const name of names) {
    const cache = await caches.open(name);
    const response = await cache.match(request);
    if (!response) continue;
    const timestamp = Number(response.headers.get(CACHE_TIME_HEADER) ?? 0);
    if (!timestamp || Date.now() - timestamp <= maxAgeMs) return response;
    await cache.delete(request);
  }
  return undefined;
}

async function cacheFirst(event, request) {
  const cached = await matchManagedCaches(
    request,
    CACHE_NAMES.static,
    CACHE_LIMITS.static.maxAgeMs,
  );
  if (cached) return cached;
  const response = await fetch(request);
  event.waitUntil(
    putInCache(CACHE_NAMES.static, request, response.clone(), CACHE_LIMITS.static),
  );
  return response;
}

async function staleWhileRevalidate(event, request) {
  const cached = await matchManagedCaches(
    request,
    CACHE_NAMES.content,
    CACHE_LIMITS.content.maxAgeMs,
  );
  const network = fetch(request).then((response) => {
    event.waitUntil(
      putInCache(
        CACHE_NAMES.content,
        request,
        response.clone(),
        CACHE_LIMITS.content,
        "application/json",
      ),
    );
    return response;
  });
  if (cached) {
    event.waitUntil(network.catch(() => undefined));
    return cached;
  }
  return network;
}

async function networkFirst(event, request, options) {
  const cachedPromise = matchManagedCaches(request, options.cacheName, options.limits.maxAgeMs);
  const networkPromise = fetch(request).then((response) => {
    if (response.status >= 500) throw new Error(`Server returned ${response.status}.`);
    event.waitUntil(
      putInCache(
        options.cacheName,
        request,
        response.clone(),
        options.limits,
        options.contentType,
        options.cachePublicRoute,
      ),
    );
    return response;
  });
  const cached = await cachedPromise;
  if (!cached) return networkPromise;

  const winner = await Promise.race([
    networkPromise.then((response) => ({ response })),
    wait(options.timeoutMs).then(() => ({ response: cached, timedOut: true })),
  ]).catch(() => ({ response: cached }));
  if (winner.timedOut) event.waitUntil(networkPromise.catch(() => undefined));
  return winner.response;
}

async function navigationResponse(event, request) {
  try {
    return await networkFirst(event, request, {
      cacheName: CACHE_NAMES.navigation,
      contentType: "text/html",
      limits: CACHE_LIMITS.navigation,
      timeoutMs: NAVIGATION_TIMEOUT_MS,
      cachePublicRoute: true,
    });
  } catch {
    const cached = await matchManagedCaches(
      request,
      CACHE_NAMES.navigation,
      CACHE_LIMITS.navigation.maxAgeMs,
    );
    return cached ?? caches.match(OFFLINE_URL);
  }
}

function isNextDataRequest(request, url) {
  return (
    url.searchParams.has("_rsc") ||
    request.headers.get("rsc") === "1" ||
    (request.headers.get("accept") ?? "").includes("text/x-component")
  );
}

function isStaticAsset(request, url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    ["font", "image", "script", "style"].includes(request.destination) ||
    /\.(?:css|js|woff2?|png|jpg|jpeg|webp|avif|svg|ico)$/iu.test(url.pathname)
  );
}

function isExplicitPublicContent(url) {
  return (
    searchIndexPattern.test(url.pathname) ||
    url.pathname.startsWith("/api/v1/") ||
    url.pathname === "/api/v1" ||
    publicGithubPattern.test(url.pathname)
  );
}

async function cacheRoute(urlValue) {
  const url = new URL(urlValue, self.location.origin);
  if (
    url.origin !== self.location.origin ||
    !isPublicLocaleRoute(url.pathname) ||
    url.pathname.startsWith("/admin")
  ) {
    return;
  }
  const request = new Request(url.href, {
    cache: "no-cache",
    credentials: "same-origin",
    headers: { Accept: "text/html" },
  });
  const response = await fetch(request);
  await putInCache(
    CACHE_NAMES.navigation,
    request,
    response.clone(),
    CACHE_LIMITS.navigation,
    "text/html",
    true,
  );
  if (/^\/(?:en|ja|zh-CN|de)\/?$/u.test(url.pathname)) {
    await putInCache(
      CACHE_NAMES.navigation,
      new Request(new URL("/", self.location.origin).href, { headers: { Accept: "text/html" } }),
      response,
      CACHE_LIMITS.navigation,
      "text/html",
      true,
    );
  }
}

async function cacheRouteIfMissing(urlValue) {
  const url = new URL(urlValue, self.location.origin);
  const request = new Request(url.href, { headers: { Accept: "text/html" } });
  const cached = await matchManagedCaches(
    request,
    CACHE_NAMES.navigation,
    CACHE_LIMITS.navigation.maxAgeMs,
  );
  if (!cached) await cacheRoute(url.href);
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAMES.core).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(cleanupOldCaches().then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CACHE_ROUTE") event.waitUntil(cacheRoute(event.data.url));
  if (event.data?.type === "CACHE_ROUTE_IF_MISSING") {
    event.waitUntil(cacheRouteIfMissing(event.data.url));
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/admin")) return;

  if (request.mode === "navigate") {
    if (url.pathname === "/" || isPublicLocaleRoute(url.pathname)) {
      event.respondWith(navigationResponse(event, request));
    } else {
      event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    }
    return;
  }
  if (url.pathname.startsWith("/api/") && !isExplicitPublicContent(url)) return;
  if (isNextDataRequest(request, url) && isPublicLocaleRoute(url.pathname)) {
    event.respondWith(
      networkFirst(event, request, {
        cacheName: CACHE_NAMES.content,
        contentType: "text/x-component",
        limits: CACHE_LIMITS.content,
        timeoutMs: NAVIGATION_TIMEOUT_MS,
        cachePublicRoute: true,
      }),
    );
    return;
  }
  if (isExplicitPublicContent(url)) {
    event.respondWith(staleWhileRevalidate(event, request));
    return;
  }
  if (isStaticAsset(request, url)) event.respondWith(cacheFirst(event, request));
});

self.addEventListener("sync", (event) => {
  if (event.tag !== "zomer-chat-outbox") return;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) client.postMessage({ type: "SYNC_CHAT_OUTBOX" });
      }),
  );
});

function sameOriginPath(value) {
  try {
    const url = new URL(value || "/blogs", self.location.origin);
    return url.origin === self.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : "/blogs";
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
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (windows) => {
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
