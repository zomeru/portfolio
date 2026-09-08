<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Web guidance

This workspace is the Next.js 16 App Router portfolio and the sole deployed application process.
Server-rendered pages consume the canonical published portfolio service from `@portfolio/api`; the
Hono backend and stateless MCP handlers are mounted inside the same deployment.

## Route and rendering invariants

- Public routes are `/`, `/work/[slug]`, `/projects`, `/projects/[slug]`, `/blogs`,
  `/blogs/[slug]`, `/github-contributions`, `/ask`, `/contact`, and `/developers`. `/admin` is private
  and force-dynamic.
  Keep pages and layouts as Server Components unless a browser API, interaction state, or effect
  requires a narrow client boundary.
- `src/app/api/[[...route]]/route.ts` is only the `hono/vercel` adapter for `@portfolio/api`.
  Backend routes, validation, auth, provider calls, and persistence belong in `apps/api`.
- Use `src/lib/api-server.ts` for server-to-API calls; it binds the Hono client to
  `apiApp.request` and avoids a network hop. Browser callers use `src/lib/api.ts` and import only
  `AppType` from `@portfolio/api/types`. Keep the browser client marked `client-only` and derive its
  origin from `window`; do not import environment parsers into the client graph.
- Keep the Ask Zomer client responsible only for the local UUID session key, history restoration,
  transport, stream presentation, portfolio and web sources, search status, suggestions, stop/retry
  state, and accessibility. Intent, retrieval, tool selection, prompts, models, rate limits, and
  persistence belong in the API.
- `src/components/layout/page-transition.tsx` owns route enter transitions through React View
  Transitions. Keep the animation CSS in `src/app/globals.css` and preserve the reduced-motion
  override.
- `public/sw.js` is a standards-based offline worker. Keep immutable assets cache-first; public
  locale navigations and RSC payloads bounded network-first; the localized search index, public REST
  contract, and anonymized GitHub reads bounded stale-while-revalidate. Never cache admin, assistant,
  notification, mutation, or other private API traffic. Preserve one rollback cache generation,
  keep WebLLM caches and IndexedDB outside worker cleanup, retain the last-resort fallback, and
  validate notification-click URLs against the site origin. Blog subscription UI stays in a narrow
  client component.
- Reuse components under `src/components` and tokens in `src/app/globals.css`. Preserve keyboard
  access, visible focus, semantic headings, live-region behavior, touch targets, and reduced-motion
  handling.

## Sanity, metadata, and discovery

- Website portfolio reads use `@portfolio/api/public-portfolio`; do not add web-specific Sanity
  queries for profile, resume, experience, projects, blogs, or tech stack. The API workspace owns
  their published perspective, projections, DTOs, ordering, and on-demand cache tags.
- Do not edit `src/lib/sanity/sanity.types.ts`. Run the Studio `typegen` script after any schema
  change and review `apps/studio/schema.json` plus the generated web types. Studio TypeGen does not
  validate the canonical API queries.
- Build page metadata with `src/lib/metadata.ts` and `@portfolio/env/site`. Keep canonical, Open
  Graph, Twitter, robots, sitemap, and `NEXT_PUBLIC_SITE_URL` behavior consistent.
- Route-specific `opengraph-image.tsx` files use `src/lib/og-image.tsx`; matching Twitter files
  re-export them. The sitemap uses `siteUpdatedAt` for monthly static pages and each publication date
  for yearly blog entries. Update `siteUpdatedAt` for material site releases.
- Robots must continue to exclude `/admin` and private API families while keeping `/api/v1`,
  `/api/mcp`, OpenAPI, and well-known discovery resources crawlable.
- `/robots.txt` is a custom Route Handler so it can advertise the emerging NLWeb `schemamap`
  directive alongside the standard sitemap. Keep `/schemamap.xml` aligned with the public
  schema.org JSON Lines feed at `/structured-data/portfolio.jsonl`.
- `/llms.txt` and `/llms-full.txt` are generated text Route Handlers backed by published Sanity
  content. Keep their API/discovery links aligned with `/developers/llms.txt`.
- `src/app/api/mcp/**` owns the thin `mcp-handler` adapters. Tool registration uses MCP SDK v2,
  complete Zod schemas, structured content plus text fallback, and read-only annotations. Do not add
  legacy SSE routes or session persistence.
- Generate OpenAPI and all discovery cards/catalogs from `@portfolio/api/public-portfolio`; never
  check in a second static contract.

## Admin and telemetry

- The entire admin page first verifies `ADMIN_ACCESS_KEY` and stores only its signed eight-hour
  session in an `HttpOnly`, `SameSite=Strict`, `/admin` cookie. Do not load or render privileged admin
  data until this outer gate is valid, and re-authorize admin mutations against it.
- Admin access is capability-specific. Blog publishing verifies `CRON_SECRET`; AI reindexing
  verifies `AI_INDEX_SECRET_KEY`. Store only the signed eight-hour capability token in an `HttpOnly`,
  `SameSite=Strict`, `/admin` cookie and re-authorize every mutation.
- Blog generation goes through the in-process Hono route, then revalidates the blog list and created
  path. Treat publishing and best-effort AI indexing as separate outcomes in the UI.
- The browser reindex form calls `src/app/admin/api/ai/reindex/route.ts`, which reads the server-only
  capability cookie and proxies the streaming Hono response. Never send the raw capability secret to
  client JavaScript.
- `src/instrumentation.ts` loads Node-only telemetry from `src/instrumentation.node.ts`. Langfuse
  is enabled only when both keys validate; do not move this registration into browser or Edge code.

## Verification

- Run `pnpm --filter @portfolio/web check-types` after TypeScript or route changes.
- Do not add automated tests in `apps/web` for pages, components, styling, metadata, discovery routes,
  admin controls, or source-code patterns. This is a portfolio frontend; use type checking, builds,
  and focused browser verification instead.
- If web behavior contains genuinely complex logic, first move that logic to its owning API or shared
  module and test it there. Add a web test only when the user explicitly requests one and no smaller
  non-web boundary can cover the risk.
- Run `pnpm --filter @portfolio/web build` after routing, metadata, discovery, configuration,
  instrumentation, or dependency changes.
- Run `pnpm analyze` for an on-disk Next.js bundle report when evaluating dependency or client-boundary
  changes. It is a diagnostic command, not a thresholded CI gate.
- Test affected browser interactions in a production build and check changed layouts at mobile and
  desktop widths.
- After API adapter, admin, or streaming changes, verify the in-process server client and browser HTTP
  client paths separately.
