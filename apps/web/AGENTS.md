<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Web guidance

This workspace is the Next.js App Router portfolio. Pages are server-rendered from published Sanity content; reusable UI lives in `src/components`, and Sanity access lives in `src/lib/sanity`.

- Keep pages and layouts server components unless browser state or effects require a client boundary.
- Add GROQ in `src/lib/sanity/queries.ts`, fetch through `sanityFetch`, and expose domain reads through `src/lib/sanity/services`. Preserve cache tags and explicit revalidation choices.
- Do not hand-edit `src/lib/sanity/sanity.types.ts`; regenerate it with the Studio `typegen` script after schema/query changes.
- Reuse the existing layout, portfolio, and theme components and the Tailwind tokens defined in `src/app/globals.css`.
- Run `pnpm --filter @portfolio/web check-types`; run the workspace `build` for routing, metadata, configuration, or data-fetching changes.
- Update this file when web behavior, structure, data access, conventions, or workflows change.
