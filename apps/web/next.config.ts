import { getSanityEnv } from "@portfolio/env/sanity";
import { getSiteEnv } from "@portfolio/env/site";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const sanityEnv = getSanityEnv();
const siteEnv = getSiteEnv(
  process.env.NEXT_PUBLIC_SITE_URL ? process.env : { ...process.env, NODE_ENV: "development" },
);
const canonicalSiteUrl = new URL(siteEnv.siteUrl ?? "https://portfolio.localhost");

const isDevelopment = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://app.cal.com`,
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

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
] as const;

const discoveryLinkHeader = [
  ["/openapi.json", "service-desc", "application/vnd.oai.openapi+json"],
  ["/.well-known/api-catalog", "api-catalog", "application/linkset+json"],
  ["/.well-known/mcp/server-card.json", "service-meta", "application/json"],
  ["/.well-known/mcp/docs-server-card.json", "service-meta", "application/json"],
  ["/.well-known/agent-skills/index.json", "service-meta", "application/json"],
  ["/llms.txt", "alternate", "text/plain"],
] as const;

const discoveryLinks = discoveryLinkHeader
  .map(
    ([path, relation, type]) =>
      `<${new URL(path, canonicalSiteUrl).href}>; rel="${relation}"; type="${type}"`,
  )
  .join(", ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/(.*)", headers: [...securityHeaders] },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
      { source: "/", headers: [{ key: "Link", value: discoveryLinks }] },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: `/images/${sanityEnv.projectId}/${sanityEnv.dataset}/**`,
      },
    ],
  },
  poweredByHeader: false,
  reactCompiler: true,
};

const withNextIntl = createNextIntlPlugin({ requestConfig: "./src/i18n/request.ts" });

export default withNextIntl(nextConfig);
