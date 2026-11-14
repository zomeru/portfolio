# Audit progress

Branch `dev`, starting commit `edf8d79`. Local-only git identity set to the existing author
(`Zomer Gregorio`). Owner-held, uncommitted files left untouched and never staged: `CLAUDE.md`
(context-mode rules) and `docs/cloudflare-migration.md` (edited in place, not committed by request).

## Baseline (before any change, 2026-11-14)

Toolchain: Node 26.13.1 (matches `.node-version`, `engines`, `devEngines`), pnpm 12.18.0 (matches
`packageManager`). CI (`.github/workflows/ci.yml`) reads `.node-version` and `packageManager`.

| Check                                        | Result                                                                                         |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`             | Pass                                                                                           |
| `pnpm run format:check`                      | Fail: only the owner's uncommitted `CLAUDE.md` (pre-existing, outside scope)                   |
| `oxlint .` (type-aware via tsgolint)         | Pass                                                                                           |
| `pnpm boundaries`                            | Pass                                                                                           |
| `syncpack lint`                              | Pass                                                                                           |
| `knip`                                       | Pass                                                                                           |
| `turbo run check-types --force`              | Pass (6 tasks, TypeScript 7.0.2)                                                               |
| `turbo run test --force`                     | Pass (API: 30 tests, 30 pass)                                                                  |
| `turbo run build --force`                    | Pass (web staging + Studio). Warning: prerender preview reports `No environment ... "staging"` |
| `pnpm build:production`                      | Pass                                                                                           |
| `wrangler deploy --dry-run --env production` | Pass: 17,318.23 KiB / gzip 4,385.23 KiB                                                        |
| `pnpm audit` / `pnpm audit --prod`           | No known vulnerabilities                                                                       |
| `pnpm outdated -r`                           | 12 patch/minor updates; Drizzle on `1.0.0-rc.4` (rc.5 published); TS `7.1.0-beta` published    |

Note: a staging dry-run after a production build fails by design (Wrangler rejects an env that
differs from the built target); the dry-run must follow a build of the same environment.

## Final verification (after all changes)

| Check                                             | Result vs baseline                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm install --frozen-lockfile`                  | Pass; no peer warnings                                                                     |
| `pnpm run format:check`                           | Fail: only the owner's uncommitted `CLAUDE.md` (pre-existing, unchanged)                   |
| `oxlint .`, `boundaries`, `syncpack lint`, `knip` | Pass                                                                                       |
| `turbo run check-types --force`                   | Pass (6 tasks, TypeScript 7.1.0-beta)                                                      |
| `turbo run test --force`                          | Pass (30/30)                                                                               |
| `turbo run build --force`                         | Pass (same cosmetic prerender warning as baseline)                                         |
| `pnpm run deploy:staging --dry-run`               | Pass: 17,334.90 KiB / gzip 4,388.74 KiB (+16.7 / +3.5 KiB from dependency updates)         |
| `pnpm run deploy:production --dry-run`            | Pass: same size                                                                            |
| `db:check:ci` (`drizzle-kit check`, offline)      | Pass with a placeholder `DATABASE_URL` (the config requires one; no connection is made)    |
| Studio TypeGen, `tsr generate`, `wrangler types`  | Regenerate with no diff                                                                    |
| `pnpm audit` / `pnpm audit --prod`                | No known vulnerabilities                                                                   |
| `pnpm outdated -r`                                | Only `@opentelemetry/api` 1.10.0 (held by peer range)                                      |
| Catalog references                                | All resolve; no dependency declares its own version in more than one manifest              |
| workerd preview (`vite preview`, staging build)   | Key routes 200; 404, `/en` 307, admin private; cache MISS→HIT on HTML, feeds, search index |
| Rendered `<head>` of 17 paths, baseline vs final  | Identical                                                                                  |

Workerd verification used a temporary `dist/server/.dev.vars` generated from `.env.local` with the
database URLs replaced by `127.0.0.1:9` so no remote database could be written. It was deleted
afterwards. The baseline comparison built `edf8d79` from `git archive` in a scratch directory.

## Checklist

| Section                                 | Status |
| --------------------------------------- | ------ |
| 1. Baseline                             | Done   |
| 2. Repository and migration history     | Done   |
| 3. Documentation research               | Done   |
| 4. Dependencies and catalogs            | Done   |
| 5. TypeScript 7.1 Beta                  | Done   |
| 6. Start/Workers/caching/database audit | Done   |
| 7. Next.js/Vercel leftovers             | Done   |
| 8–9. Implementation and docs            | Done   |
| 10. Verification                        | Done   |

## Decisions

- TypeScript 7.1 Beta needs no second TypeScript install: no tool in the graph uses the classic
  compiler API (it was already absent in 7.0.2).
- Drizzle stays on `1.0.0-rc.4` until migrations can be verified against a local Postgres.
- `@opentelemetry/api` is capped at 1.9.x by a peer range.
- The edge cache contract (60 s, per data center, versioned keys, no purge) is unchanged; locale
  pages now participate in it, and client loaders reuse data for the same window.
- `docs/cloudflare-migration.md` is updated in the working tree but not committed, by request.

Details: `findings.md`, `changes.md`, `remaining.md`.

## Resume notes

All sections are complete. To re-verify, run the commands in the tables above from the repository
root and use `--force` with Turbo tasks to bypass the local cache. Open items are in
`remaining.md`.
