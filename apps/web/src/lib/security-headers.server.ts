import "@tanstack/react-start/server-only";
import { getSiteUrl } from "./metadata";

const policy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${import.meta.env.DEV ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://app.cal.com`,
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.sanity.io https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com",
  "font-src 'self'",
  "connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://app.cal.com",
  "frame-src https://app.cal.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const discoveryLinks = [
  ["/openapi.json", "service-desc", "application/vnd.oai.openapi+json"],
  ["/.well-known/api-catalog", "api-catalog", "application/linkset+json"],
  ["/.well-known/mcp/server-card.json", "service-meta", "application/json"],
  ["/.well-known/mcp/docs-server-card.json", "service-meta", "application/json"],
  ["/.well-known/agent-skills/index.json", "service-meta", "application/json"],
  ["/llms.txt", "alternate", "text/plain"],
] as const;

export function applyResponseHeaders(
  headers: Headers,
  url: URL,
  request: Request,
  status: number,
  siteUrl: string | undefined,
) {
  const path = url.pathname;
  headers.set("Content-Security-Policy", policy);
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=()");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");

  const privateRoute =
    /^\/admin(?:\/|$)/.test(path) ||
    /^\/api\/(?:admin|ai|blog|notifications|mcp)(?:\/|$)/.test(path) ||
    /\/blogs\/unsubscribe\/?$/.test(path) ||
    (/\/ask\/?$/.test(path) && url.searchParams.has("q"));
  const html = headers.get("Content-Type")?.includes("text/html");
  if (
    privateRoute ||
    (request.method !== "GET" && request.method !== "HEAD") ||
    request.headers.has("Authorization") ||
    headers.has("Set-Cookie") ||
    status >= 400
  ) {
    headers.set("Cache-Control", "private, no-store");
  } else if (html && !headers.has("Cache-Control")) {
    headers.set("Cache-Control", "private, no-cache");
  }
  if (privateRoute || siteUrl !== "https://zomeru.dev") {
    headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  if (html) {
    headers.append("Vary", "Cookie, Accept-Language, CF-IPCountry");
  }
  if (path === "/" && html) {
    const siteUrl = getSiteUrl();
    headers.append(
      "Link",
      discoveryLinks
        .map(
          ([href, rel, type]) => `<${new URL(href, siteUrl).href}>; rel="${rel}"; type="${type}"`,
        )
        .join(", "),
    );
  }
}
