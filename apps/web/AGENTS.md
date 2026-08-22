<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Web guidance

This workspace is the Next.js App Router portfolio. Pages are server-rendered from published Sanity content; reusable UI lives in `src/components`, and Sanity access lives in `src/lib/sanity`.

## Web invariants

- Keep pages and layouts server components unless browser state or effects require a client boundary.
- Add GROQ in `src/lib/sanity/queries.ts`, fetch through `sanityFetch`, and expose domain reads through `src/lib/sanity/services`. Preserve cache tags and explicit revalidation choices.
- Build page metadata through `src/lib/metadata.ts` and the site URL contract in `@portfolio/env`.
- Keep canonical, Open Graph, Twitter, robots, and sitemap URLs consistent.
- Keep `src/app/api/[[...route]]/route.ts` as a thin `hono/vercel` adapter for `@portfolio/api`. Backend
  routes, authentication, AI calls, and Sanity writes belong in `apps/api`.
- Import API implementation only from server modules. Client-side RPC consumers must use an `import type`
  from `@portfolio/api/types` and must derive an origin that works in both browser and server contexts.
- Do not hand-edit `src/lib/sanity/sanity.types.ts`; regenerate it with the Studio `typegen` script after schema/query changes.
- Reuse the existing layout, portfolio, and theme components and the Tailwind tokens defined in `src/app/globals.css`.
- Keep `/admin` authentication server-only: verify the secret through the API-owned session helpers,
  store only a signed `HttpOnly` cookie, and re-authorize every generation Server Action.
- Preserve keyboard access, visible focus, reduced-motion support, and semantic heading order.

## Web verification

- Run `pnpm --filter @portfolio/web check-types` after TypeScript or route changes.
- Run `pnpm --filter @portfolio/web build` after routing, metadata, configuration, or data changes.
- Test affected interactions in a production build when client behavior or accessibility changes.
- Check affected layouts at desktop and mobile widths after visual changes.
