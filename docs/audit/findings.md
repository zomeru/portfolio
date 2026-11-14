# Audit findings

Scope: every workspace (`apps/web`, `apps/api`, `apps/studio`, `packages/*`), root tooling, CI,
Renovate, and the migration history from the last Next.js tree (`9e92d03`) through `edf8d79`.
Each finding carries one status: Implemented and verified, Implemented, not verified, Requires
manual configuration, Blocked, Intentionally retained, or Deferred.

## Starting state

The repository had already been through one migration audit (`b528c6b`, `15339c8`). It ran on
TypeScript 7.0.2, current TanStack Start, Vite 8, Wrangler 4, and React 19.3. All baseline checks
passed apart from formatting of the owner's uncommitted `CLAUDE.md` (see `progress.md`). Most
findings are therefore refinements, not repairs.

## Architecture (TanStack Start)

| Finding                                                                                                                                                                                                                                                                                                                                           | Status                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| File routes under `src/routes` with `{-$locale}`; loaders call `createServerFn` GET functions, so privileged reads stay on the server. Server-only modules use `@tanstack/react-start/server-only`, and `importProtection` blocks `@portfolio/api` (except `/types`) and `@portfolio/env` from client bundles. No Next.js-shaped patterns remain. | Intentionally retained   |
| `.validator()` on server functions is the current API in `@tanstack/start-client-core` 1.170 (not deprecated).                                                                                                                                                                                                                                    | Intentionally retained   |
| The router had no default stale time. Every back/forward navigation and every reuse of an intent preload called the public server functions again (Worker invocation plus Sanity query), although the same content is up to 60 seconds old at the edge. Only the locale layout and admin layout set `staleTime`.                                  | Implemented and verified |
| Admin loaders cast typed Hono responses (`(await response.json()) as X`) to hand-written types. Removing the casts makes Start's serializability validator reject the recursive `JSONValue` metadata type, and the casts also narrow what the UI consumes.                                                                                        | Intentionally retained   |
| CSRF middleware on server functions, scoped admin cookies, and the `/admin/_serverFn` base match the web `AGENTS.md` contract.                                                                                                                                                                                                                    | Intentionally retained   |

## Cloudflare Workers

| Finding                                                                                                                                                                                                                                                                                                                                      | Status                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `wrangler.jsonc` uses a current `compatibility_date` (2026-11-12), `nodejs_compat` (needed for `AsyncLocalStorage`, `node:crypto`, and SDKs), observability, version metadata, and Static Assets with `html_handling: none`. Bindings that Wrangler does not inherit (`version_metadata`, `vars`) are repeated per environment, as required. | Intentionally retained   |
| The workerd preview (`vite preview` on the built Worker) renders every key route. Without secrets it returns 500s by design: `getSanityServerEnv` requires `SANITY_API_TOKEN`.                                                                                                                                                               | Implemented and verified |
| `CLOUDFLARE_ENV=staging vite build` prints `No environment found ... "staging"` while prerendering, because the prerender preview reads the already-flattened `dist/server/wrangler.json`. The staging prerender still uses `https://preview.zomeru.dev` (checked in `dist/client/robots.txt`).                                              | Intentionally retained   |
| A staging `wrangler deploy --dry-run` after a production build fails ("does not match the target environment"). This is Wrangler's guard; the CI and package scripts always build the same environment first.                                                                                                                                | Intentionally retained   |
| No Smart Placement hint. The Worker talks to Sanity's API CDN and an HTTP Neon endpoint; placement should follow measured regional latency.                                                                                                                                                                                                  | Deferred                 |
| Production bundle: 17,318 KiB uncompressed / 4,385 KiB gzip at baseline. It fits the paid-plan limit and not the free-plan limit.                                                                                                                                                                                                            | Intentionally retained   |

## Caching and performance

The Vercel-era design (ISR → indefinite fetch cache with signed tag invalidation) was replaced in
`b528c6b` with a Workers Cache API layer. Verified against the current Cache API docs:
`cache.put` rejects `Vary: *` and never stores `Set-Cookie` responses; entries are per data center;
`match` honours `Range`, `If-None-Match`, and `If-Modified-Since`, which the gate excludes.

| Finding                                                                                                                                                                                                                                                                                                                                                                                                                   | Status                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Allowlisted public HTML, feeds, search index, and social images use the Cache API keyed by URL plus Worker version (60 s, images 300 s). Browser responses stay `private, no-cache` (HTML) or `no-cache`. Measured locally: ~0.3–1 s miss, 5–10 ms hit.                                                                                                                                                                   | Intentionally retained   |
| **Bug (performance):** an explicit locale URL (`/ja`, `/de/projects`, …) visited without a matching saved/detected locale sets a preference cookie. The cookie headers were merged before the cache gate, so these pages always bypassed the cache, both for lookups and stores. First visits from search results and shared links, and crawlers, never hit the cache. Baseline workerd preview confirmed `/ja` uncached. | Implemented and verified |
| Locale headers were appended to `Vary`, duplicating `Cookie, Accept-Language, CF-IPCountry`.                                                                                                                                                                                                                                                                                                                              | Implemented and verified |
| No global purge: an edit becomes visible as the 60 s TTL expires in each data center. Cache-Tag purge is possible but needs a zone-scoped API token and a publish hook; not justified at this TTL.                                                                                                                                                                                                                        | Intentionally retained   |
| Server-function GET responses (client navigation) bypass the Worker cache (`x-tsr-serverFn`). The new router stale time reduces how often they run.                                                                                                                                                                                                                                                                       | Implemented and verified |

## Database

| Finding                                                                                                                                                                                                                                                                                                                                                                      | Status                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `drizzle-orm/neon-http` with a lazily created module-level client. The HTTP driver holds no sockets, so reuse across requests in an isolate is safe on Workers. Multi-statement writes use `db.batch` (one round trip, transactional on Neon HTTP). No relational queries (`db.query`). Hyperdrive would require switching to a TCP driver and adds nothing measurable here. | Intentionally retained        |
| `listRecentIngestionRuns` returned an un-awaited Drizzle query builder across the package boundary. TypeScript 7.1 reports its inferred type as non-portable (TS2883).                                                                                                                                                                                                       | Implemented and verified      |
| Drizzle `1.0.0-rc.5` is published. Its kit release switches to incremental snapshots, and the ORM has many RQB/driver breaking changes (none affect this code path). Migrations cannot be verified without a local Postgres, so the upgrade is held at `1.0.0-rc.4`.                                                                                                         | Deferred                      |
| Staging and production Workers both run with `NODE_ENV=production`, so persisted error records cannot tell them apart. This was already true after the migration, because `VERCEL_ENV` is never set on Workers.                                                                                                                                                              | Requires manual configuration |

## Dependencies

| Finding                                                                                                                                                                          | Status                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 12 outdated patch/minor packages; no outdated majors (`pnpm outdated -r`, respecting pnpm's default one-day minimum release age, so `wrangler` 4.162.0 was not yet eligible).    | Implemented and verified |
| `@opentelemetry/api` 1.10.0 exceeds `@opentelemetry/sdk-trace-base` 2.x's peer range (`<1.10.0`).                                                                                | Deferred                 |
| 11 dependencies were declared with identical versions in 2–7 manifests; no catalog existed.                                                                                      | Implemented and verified |
| 9 of 12 `overrides` no longer changed resolution; only js-yaml 3.x, smol-toml, and `@oclif/core` → minimatch (all under Sanity's CLI) are still needed for a clean `pnpm audit`. | Implemented and verified |
| `minimumReleaseAgeExclude` listed 34 exact versions that are now old enough or no longer installed.                                                                              | Implemented and verified |
| Renovate's database group named `pg` and `@types/pg`, which were never installed.                                                                                                | Implemented and verified |
| `next-themes` is framework-agnostic React despite its name and is still used for theme switching.                                                                                | Intentionally retained   |
| `knip`, `syncpack`, `turbo boundaries`, and `pnpm audit` report no issues.                                                                                                       | Implemented and verified |

## TypeScript

| Finding                                                                                                                                                                                                                                                                                                                                                                                | Status                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| The `typescript` package has shipped without the classic JS API since 7.0 (exports only `version` and `unstable/*`), so the API consumers in the graph already work without it: commitlint/cosmiconfig, knip, Sanity's module-federation DTS plugin, and `oxlint-tsgolint`, which bundles its own typescript-go. 7.1 Beta adds no new API risk and needs no second TypeScript install. | Implemented and verified |
| TypeScript 7.1's distributive-constraint and `lib.d.ts` changes produced no errors. The only new error was TS2883 (above).                                                                                                                                                                                                                                                             | Implemented and verified |
| No `any`, `@ts-ignore`, `@ts-expect-error`, or double casts in authored code. The remaining `as` casts are narrowing at validated boundaries (select values, JSON lines, Hono payloads).                                                                                                                                                                                               | Intentionally retained   |
| Every workspace overrode the base `NodeNext` module settings with `ESNext`/`Bundler` and re-declared `noEmit`. `strictNullChecks`, `forceConsistentCasingInFileNames`, and `esModuleInterop` were redundant; `declarationMap` and `allowJs` did nothing without emit or JS inputs.                                                                                                     | Implemented and verified |
| `verbatimModuleSyntax` (previously API-only) holds across all workspaces without code changes.                                                                                                                                                                                                                                                                                         | Implemented and verified |
| `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `isolatedModules`, and `noUncheckedSideEffectImports` were already on.                                                                                                                                                                                                                                                       | Intentionally retained   |
| `apps/web` type-checks browser, Worker, and Node script code in one program (`DOM` + generated Worker runtime types + `@types/node` for `nodejs_compat`). Splitting it would need separate client/server include sets for little gain.                                                                                                                                                 | Intentionally retained   |
| Target stays ES2022. TS 7.1 adds `es2026`, but no code needs the new library methods.                                                                                                                                                                                                                                                                                                  | Intentionally retained   |

## Next.js and Vercel leftovers

| Finding                                                                                                                                   | Status                        |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| No `next`, `@vercel/*`, `next.config.*`, `vercel.json`, `.vercel`, `NEXT_PUBLIC_*`, ISR, or `revalidate` code remains in the repository.  | Implemented and verified      |
| `apps/api/src/lib/log.ts` read `VERCEL_ENV` before `NODE_ENV`.                                                                            | Implemented and verified      |
| `.graphifyignore` listed `.vercel` and `.next/`.                                                                                          | Implemented and verified      |
| README cutover steps (disable the `/api/revalidate/sanity` Sanity webhook and the old scheduler) remain until the owner confirms cutover. | Requires manual configuration |
| "Next.js" in evaluation datasets, fixtures, prompts, and Studio blog data is portfolio content, not framework code.                       | Intentionally retained        |
| `@vercel/frameworks` appears transitively under `@sanity/cli`.                                                                            | Intentionally retained        |

## SEO and accessibility

The rendered `<head>` (title, description, canonical, hreflang alternates, Open Graph, Twitter,
robots) of 17 key paths is byte-identical between the baseline commit and the final tree in workerd
(`progress.md`). The preview `/robots.txt`, `/openapi.json`, discovery routes, 404 page, `/en` → `/`
redirect, and noindex on staging all behave as before. No UI or markup changed, so the
accessibility findings of the earlier audits still apply.
