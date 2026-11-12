# Web guidance

This workspace owns the TanStack Start UI, Cloudflare Worker entry, machine discovery, and MCP
transports. Preserve the existing public URLs, translated content, and portfolio UI.

- Use file routes under `src/routes`, with `{-$locale}` for optional language prefixes. English
  canonical links omit `/en`. Keep locale detection and explicit preference cookies aligned.
- Loaders can execute in the browser. Put privileged operations in Start server functions or server
  route handlers, with server modules marked `@tanstack/react-start/server-only`.
- Keep the Hono adapter thin. Use `src/lib/api-server.ts` for same-process RPC and `src/lib/api.ts`
  for browser RPC. Import only `AppType` from `@portfolio/api/types` in browser code.
- Canonical public data comes from `@portfolio/api/public-portfolio`. Keep published Sanity reads
  request-scoped. Do not add duplicate GROQ queries in the web app.
- Prerender only deployment-owned documents. Keep the Worker Cache API allowlist restricted to
  deterministic public responses, with short TTLs for published content and keys scoped to the
  Worker version. Keep private, query-bearing, cookie-setting, and error responses out of it.
- Preserve real 404s, localized canonical and alternate links, and the formats of discovery
  endpoints. Keep public MCP tools stateless and read-only.
- Admin actions and private loaders must verify the outer gate on the server. Preserve
  capability-specific sessions and the scoped HttpOnly cookies. Apply CSRF checks on mutations
  and keep admin HTTP responses private.
- Keep Worker secrets in runtime bindings. Never expose secrets through a Vite public prefix or
  serialized route data. Generate the Worker and route tree types with their owning tools.
- Preserve keyboard and focus support, reduced motion, service-worker boundaries, and the existing
  layout tokens in `src/globals.css`. Keep browser-heavy interactions in lazy components.
- Run the web type check and Worker build after changes. Exercise public and private routes through
  workerd preview, and verify both Hono client paths when changing the adapter.
