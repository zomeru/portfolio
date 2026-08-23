<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Web guidance

This workspace is the Next.js 16 App Router portfolio and the sole deployed application process.
Server-rendered pages consume published Sanity content; the Hono backend is mounted inside the same
deployment.

## Route and rendering invariants

- Public routes are `/`, `/projects`, `/blogs`, `/blogs/[slug]`,
  `/github-contributions`, `/ask`, and `/contact`. `/admin` is private and force-dynamic.
  Keep pages and layouts as Server Components unless a browser API, interaction state, or effect
  requires a narrow client boundary.
- `src/app/api/[[...route]]/route.ts` is only the `hono/vercel` adapter for `@portfolio/api`.
  Backend routes, validation, auth, provider calls, and persistence belong in `apps/api`.
- Use `src/lib/api-server.ts` for server-to-API calls; it binds the Hono client to
  `apiApp.request` and avoids a network hop. Browser callers use `src/lib/api.ts` and import only
  `AppType` from `@portfolio/api/types`.
- Keep the Ask Zomer client responsible only for the local UUID session key, history restoration,
  transport, stream presentation, sources, suggestions, stop/retry state, and accessibility. Intent,
  retrieval, prompts, models, rate limits, and persistence belong in the API.
- Reuse components under `src/components` and tokens in `src/app/globals.css`. Preserve keyboard
  access, visible focus, semantic headings, live-region behavior, touch targets, and reduced-motion
  handling.

## Sanity, metadata, and discovery

- Put GROQ in `src/lib/sanity/queries.ts`, fetch through `sanityFetch`, and expose domain reads
  through `src/lib/sanity/services`. Use `defineQuery`, explicit projections, stable ordering,
  cache tags, and deliberate `revalidate`/`useCdn` choices.
- Web reads use the published perspective with authenticated server access. The default revalidation
  is 300 seconds; blog slug discovery uses 3,600 seconds and bypasses the CDN for freshness.
- Do not edit `src/lib/sanity/sanity.types.ts`. Run the Studio `typegen` script after any schema
  or query change and review both generated artifacts.
- Build page metadata with `src/lib/metadata.ts` and `@portfolio/env/site`. Keep canonical, Open
  Graph, Twitter, robots, sitemap, and `NEXT_PUBLIC_SITE_URL` behavior consistent.
- Route-specific `opengraph-image.tsx` files use `src/lib/og-image.tsx`; matching Twitter files
  re-export them. The sitemap includes public routes plus published blog slugs. Robots must continue to
  exclude `/admin` and `/api/`.
- `/llms.txt` and `/llms-full.txt` are generated text Route Handlers backed by published Sanity
  content and revalidate hourly. Keep their public route lists aligned with the sitemap and navigation.

## Admin and telemetry

- Admin access is capability-specific. Blog publishing verifies `CRON_SECRET`; AI reindexing
  verifies `OPENROUTER_API_KEY`. Store only the signed eight-hour capability token in an `HttpOnly`,
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
- Run `pnpm --filter @portfolio/web build` after routing, metadata, Sanity query, configuration,
  instrumentation, or dependency changes.
- Test affected browser interactions in a production build and check changed layouts at mobile and
  desktop widths.
- After API adapter, admin, or streaming changes, verify the in-process server client and browser HTTP
  client paths separately.
