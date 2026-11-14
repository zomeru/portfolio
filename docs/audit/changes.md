# Audit changes

Commits are on `dev` after `edf8d79`, authored and committed by the repository owner's identity.
Statuses follow `findings.md`.

## Caching and Workers

### Locale-prefixed pages use the edge cache — Implemented and verified (`b5679e0`)

`apps/web/src/server.ts` now always routes through `servePublicCache`. When `localeRedirect`
returns preference headers (an explicit `/ja`, `/zh-CN`, or `/de` URL for a visitor whose saved
or detected locale differs), they are applied after the cache lookup:

- the shared cache entry is stored without `Set-Cookie`;
- every response still sets `PORTFOLIO_LOCALE` and `Cache-Control: private, no-store`;
- `Vary` tokens are merged instead of duplicated.

This is safe because the HTML for a locale-prefixed URL depends only on the URL; the cache gate
already treated requests with only a locale cookie as equivalent. In workerd, `/ja` with no cookie
went from an uncached render on every request (baseline) to MISS then HIT, with the cookie on both.

### Router loader reuse — Implemented and verified (`e9e287c`)

`apps/web/src/router.tsx` sets `defaultStaleTime: 60_000`, matching the edge TTL for published
content. Client navigation and intent preloads reuse loader data for 60 seconds instead of calling
server functions again. The duplicate `staleTime` on the locale and admin layouts was removed.
The admin dashboard and error routes set `staleTime: 0` and still call `router.invalidate()` after
mutations.

### Freshness model (unchanged contract, documented)

| Layer                          | Scope           | Max staleness | Invalidation                                   |
| ------------------------------ | --------------- | ------------- | ---------------------------------------------- |
| Static Assets `/_build/*`      | Browser + CDN   | Immutable     | New fingerprint per build                      |
| Prerendered discovery docs     | Static Assets   | Per deploy    | New deploy                                     |
| Worker Cache API (HTML, feeds) | One data center | 60 s          | TTL; Worker version in the key on each deploy  |
| Worker Cache API (OG images)   | One data center | 300 s         | TTL; Worker version in the key                 |
| Router loader data             | One browser tab | 60 s          | TTL; `router.invalidate()` after admin actions |
| Browser HTTP cache (HTML)      | Browser         | 0             | `private, no-cache` (always revalidates)       |

Admin, API mutations, errors, authorized requests, query-bearing URLs, and cookie-setting
responses are never stored.

## Dependencies

| Commit    | Change                                                                                                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `771cf92` | `turbo` 2.11.10 → 2.11.11, `oxlint-tsgolint` 7.0.2006 → 7.0.2007, `wrangler` 4.160.1 → 4.161.0                                                                                                                            |
| `2f661af` | `ai` 7.0.169 → 7.0.172, `@ai-sdk/google` → 4.0.120, `@ai-sdk/groq` → 4.0.83, `@ai-sdk/openai-compatible` → 3.0.92, `@ai-sdk/react` → 4.0.176, `@hono/node-server` → 2.1.8, `use-intl` → 4.15.1, `@sanity/client` → 8.16.0 |
| `8b7e139` | Default pnpm catalog (below)                                                                                                                                                                                              |
| `0927494` | `typescript` 7.0.2 → 7.1.0-beta                                                                                                                                                                                           |
| `8f34a8b` | Removed 9 obsolete overrides and every `minimumReleaseAgeExclude` entry                                                                                                                                                   |
| `82a248f` | Renovate database group: `pg`/`@types/pg` → `@neondatabase/serverless`                                                                                                                                                    |

No packages were added or removed. All updates were patch or minor; no major migration guides
applied.

### Catalog

`pnpm-workspace.yaml` `catalog:` now owns every dependency declared by more than one manifest:
`@types/node`, `@types/react`, `@types/react-dom`, `@opentelemetry/api` (`~1.9.1`, held by the
`sdk-trace-base` peer range), `ai`, `hono`, `react`, `react-dom`, `tsx`, `typescript`
(`7.1.0-beta`, exact), and `zod`. Manifests reference them with `catalog:`. Single-use
dependencies stay in their owning manifest. No named catalogs, `catalogMode`, or
`strictPeerDependencies` were added: one React major is shared and pnpm reports no peer
conflicts. `syncpack lint` passes with catalogs.

### Overrides kept

`js-yaml@>=3 <3.15.2`, `@oclif/core>minimatch@>=7 <11.0.1`, and `smol-toml@<1.9.0`. All come
through Sanity's CLI, whose ranges still allow vulnerable versions. Each is annotated as a
security floor to delete once `pnpm audit` is clean without it.

## TypeScript

- `0927494`: TypeScript 7.1.0-beta from the catalog. `packages/database` now exports
  `IngestionRun` and `listRecentIngestionRuns` awaits its query and returns `Promise<IngestionRun[]>`
  (fixes TS2883 in `apps/api`).
- `6257082`: `packages/typescript-config/base.json` sets `module: ESNext`,
  `moduleResolution: Bundler`, `noEmit`, and `verbatimModuleSyntax` once. The per-package overrides,
  `esModuleInterop`, `declarationMap`, `allowJs`, `strictNullChecks`, and
  `forceConsistentCasingInFileNames` were removed. `declaration` stays on so TypeScript keeps
  checking that types crossing package boundaries are portable. Studio keeps `module: preserve`;
  each server-only package keeps `lib: ["ESNext"]` and its `types`.

No suppressions were added. The route tree (`tsr generate`), Worker types (`wrangler types`), and
Studio TypeGen (`pnpm --filter @portfolio/studio run typegen`: schema extract plus
`sanity.types.ts`) all regenerate with no diff.

## Leftovers removed

- `4c7b1da`: `VERCEL_ENV` fallback in `apps/api/src/lib/log.ts`; `.vercel` and `.next/` in
  `.graphifyignore`.

## Documentation

- `docs/audit/*` (this directory).
- `README.md`: dependency management, TypeScript beta, and locale caching notes.
- `docs/cloudflare-migration.md`: updated in place; left uncommitted at the owner's request.
