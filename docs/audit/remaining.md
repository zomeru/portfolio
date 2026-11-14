# Remaining work

Nothing here blocks deployment of the committed changes. Statuses follow `findings.md`.

## Code

- **Error-record environment** — Requires manual configuration. Staging and production Workers both
  record `environment: "production"` because both set `NODE_ENV=production`. If they share an
  error database and need separating, add a non-secret var such as `PORTFOLIO_ENVIRONMENT`
  (`staging` / `production`) to each `env.*.vars` block in `apps/web/wrangler.jsonc`, then read it
  in `apps/api/src/lib/log.ts` before `NODE_ENV`. Run `pnpm cf:typegen` afterwards.

## Dependency compatibility

- **Drizzle `1.0.0-rc.5`** — Deferred. Steps, against a local Postgres only:
  1. Start a disposable Postgres with pgvector and set `DATABASE_URL` / `DATABASE_DIRECT_URL` in a
     local env file to it.
  2. Bump `drizzle-orm` and `drizzle-kit` together in `packages/database/package.json`.
  3. Run `pnpm --filter @portfolio/database exec drizzle-kit up` and review the snapshot changes
     (rc.5 stores incremental snapshots).
  4. Run `db:check:ci`, then `db:migrate` against the local database, then `pnpm test` and
     `pnpm ai:eval`.
  5. Confirm `.github/workflows/migrate-db.yml` still runs `drizzle-kit migrate` unchanged.
- **`@opentelemetry/api` 1.10** — Deferred until `@opentelemetry/sdk-trace-base` widens its
  `<1.10.0` peer range. Then change the catalog entry from `~1.9.1` to `^1.10.0`.
- **`wrangler` 4.162.0** — Deferred by pnpm's default one-day minimum release age; Renovate will
  pick it up.
- **Overrides** — Deferred. Remove each of the three remaining entries in `pnpm-workspace.yaml`
  when `pnpm audit` stays clean without it (Sanity CLI upgrades).

## TypeScript compatibility

- **TypeScript 7.1 Beta → stable** — Deferred. The beta announcement expects an RC about a month
  after the beta (released 2026-10-20) and a final release after that. Change the catalog entry to
  the stable version and rerun `pnpm check-types`.
- No tool needs a second TypeScript install today. If a future tool needs the classic compiler API,
  ask before adding an aliased TypeScript 6 install.

## Cloudflare configuration

- **Placement** — Deferred. Consider `"placement": { "mode": "smart" }` only after comparing
  Worker wall-time for Sanity and Neon calls across regions in Workers Observability.
- **Cache-Tag purge** — Deferred (future). Only if 60-second staleness becomes a problem: tag
  entries per document, then purge from the publish path using a zone-scoped API token stored as a
  Worker secret.

## Secrets and environment

- No new secrets or bindings. Local workerd preview needs `apps/web/.dev.vars` created **before**
  `pnpm build` (the Cloudflare plugin copies it into `dist/server`). Never commit it.

## External services

- **Old webhook and scheduler** — Requires manual configuration. If not already done at cutover,
  disable the Sanity webhook that targets `/api/revalidate/sanity` and the previous (Vercel) cron
  scheduler (README, "Cloudflare deployment").

## Manual verification

- Deploy to staging, then check: `/ja` and `/de/projects` return `Server-Timing:
  portfolio-cache;desc="HIT"` on a repeated request while still sending `Set-Cookie` and
  `Cache-Control: private, no-store`; admin dashboard data refreshes after each action; and
  back/forward navigation on public pages makes no server-function requests within 60 seconds.
- Field Core Web Vitals and cache hit ratios were not measured; local timings only.
