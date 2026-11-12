import "@tanstack/react-start/server-only";
import { isLocale, localeCookieName, type Locale } from "@/i18n/routing";

const HTML = "text/html";
const NO_CACHE = "no-cache";
const PUBLIC_PAGES = new Set(["/", "/ask", "/blogs", "/contact", "/developers", "/projects"]);
const DETAIL_PAGE = /^\/(?:blogs|projects|work)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SOCIAL_IMAGE =
  /^\/(?:(?:ask|blogs|contact|github-contributions|projects|blogs\/[a-z0-9]+(?:-[a-z0-9]+)*)\/)?(?:opengraph|twitter)-image$/;
const CONTENT_FEEDS = new Map([
  ["/llms.txt", "text/plain"],
  ["/llms-full.txt", "text/plain"],
  ["/sitemap.xml", "application/xml"],
  ["/structured-data/portfolio.jsonl", "application/x-jsonlines"],
]);

function getPolicy(pathname: string) {
  const segment = pathname.split("/")[1];
  // /en redirects for HTML. For feeds and images, leave legacy aliases on the live handler.
  if (segment === "en") return;
  const locale: Locale | undefined = segment && isLocale(segment) ? segment : undefined;
  const path = locale ? pathname.slice(locale.length + 1) || "/" : pathname;

  if (path === "/blogs/unsubscribe") return;
  if (path === "/search-index.json") return { type: "application/json", ttl: 60 };
  if (SOCIAL_IMAGE.test(path)) return { type: "image/png", ttl: 300 };
  if (!locale) {
    const type = CONTENT_FEEDS.get(path);
    if (type) return { type, ttl: 60 };
  }
  if (PUBLIC_PAGES.has(path) || DETAIL_PAGE.test(path)) return { type: HTML, ttl: 60 };
}

export async function servePublicCache(
  request: Request,
  url: URL,
  version: string | undefined,
  ctx: ExecutionContext,
  render: () => Promise<Response>,
) {
  const cookie = request.headers.get("Cookie");
  const localeOnly =
    cookie?.startsWith(`${localeCookieName}=`) &&
    isLocale(cookie.slice(localeCookieName.length + 1));
  if (
    import.meta.env.DEV ||
    !version ||
    request.method !== "GET" ||
    url.search ||
    request.headers.has("Authorization") ||
    (cookie && !localeOnly) ||
    request.headers.has("Range") ||
    request.headers.has("x-tsr-serverFn") ||
    request.headers.has("If-None-Match") ||
    request.headers.has("If-Modified-Since") ||
    request.headers.has("Cache-Control") ||
    request.headers.has("Pragma")
  ) {
    return render();
  }

  const policy = getPolicy(url.pathname);
  if (!policy) return render();
  const accepts = request.headers.get("Accept") || "*/*";
  if (policy.type === HTML && !/(^|,)\s*(\*\/\*|text\/html)/.test(accepts)) {
    return render();
  }

  const key = new URL(url);
  // Twitter and Open Graph routes render the same PNG.
  if (policy.type === "image/png") {
    key.pathname = key.pathname.replace(/\/twitter-image$/, "/opengraph-image");
  }
  key.searchParams.set("worker-version", version);

  const cache = await caches.open("portfolio-public").catch(() => undefined);
  if (!cache) return render();
  const cacheControl = policy.type === HTML ? "private, no-cache" : NO_CACHE;
  const cached = await cache.match(key.href).catch(() => undefined);
  if (cached) {
    const headers = new Headers(cached.headers);
    headers.set("Cache-Control", cacheControl);
    headers.append("Server-Timing", 'portfolio-cache;desc="HIT"');
    return new Response(cached.body, { headers });
  }

  const response = await render();
  if (
    response.status !== 200 ||
    !response.headers.get("Content-Type")?.startsWith(policy.type) ||
    response.headers.has("Set-Cookie") ||
    /\bno-store\b/i.test(response.headers.get("Cache-Control") ?? "") ||
    response.headers
      .get("Vary")
      ?.split(",")
      .some(
        (name) =>
          !["cookie", "accept-language", "cf-ipcountry"].includes(name.trim().toLowerCase()),
      )
  ) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set("Cache-Control", `public, max-age=${policy.ttl}`);
  const stored = new Response(response.clone().body, { headers });
  ctx.waitUntil(cache.put(key.href, stored).catch(() => undefined));
  response.headers.set("Cache-Control", cacheControl);
  response.headers.append("Server-Timing", 'portfolio-cache;desc="MISS"');
  return response;
}
