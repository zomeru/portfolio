# Portfolio

Personal portfolio monorepo built with pnpm and Turborepo.

## Workspaces

- `apps/web` — Next.js portfolio backed by published Sanity content.
- `apps/studio` — Sanity Studio, content schemas, seed data, and generated web types.
- `apps/api` — reusable Hono backend compiled and embedded by Next.js.
- `packages/content` — shared content limits and persisted field contracts.
- `packages/env` — shared Zod-based environment validation.
- `packages/database` — Drizzle ORM PostgreSQL client, schema, and migrations.
- `packages/typescript-config` — shared TypeScript presets.

## Development

Requires Node.js 24+, pnpm 11.22.0, and access to the configured Sanity project. Install dependencies and start the web app:

```sh
pnpm install
pnpm dev
```

Create `.env.local` at the repository root as needed:

```sh
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SITE_URL=https://zomer.vercel.app
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=development
NEXT_PUBLIC_SANITY_APP_ID=...
SANITY_API_TOKEN=...
GOOGLE_GENERATIVE_AI_API_KEY=...
GOOGLE_GENERATIVE_AI_MODEL=gemini-3.7-flash
CRON_SECRET=replace-with-at-least-32-random-characters
```

The site URL defaults to `http://localhost:3000` in development and is required in production. Public
Sanity identifiers have repository defaults in `packages/env`.
`SANITY_API_TOKEN` is required by server-side Sanity clients; automatic generation needs a write token
scoped to the target dataset. Studio seeding refuses to write outside the `development` dataset.

## API and automatic blog generation

`apps/api` owns the Hono application, middleware, routes, AI services, and Sanity writes. The deployed
Next.js app exposes that application through the thin optional catch-all adapter at
`apps/web/src/app/api/[[...route]]/route.ts`. It is a just-in-time internal package: Next.js compiles the
API TypeScript source directly, so local development does not require a separate API build or process.

Vercel Cron calls `GET /api/blog/generate` at 22:00 UTC every Tuesday, Thursday, and Saturday. Vercel
sends `CRON_SECRET` as `Authorization: Bearer <secret>`; the endpoint rejects requests without an exact
constant-time match. Set `NEXT_PUBLIC_SANITY_DATASET` explicitly for the deployed web project and use a
`SANITY_API_TOKEN` with write access only to that target dataset. Blog generation calls Google
Generative AI directly through `@ai-sdk/google`; `GOOGLE_GENERATIVE_AI_MODEL` must be a Gemini model ID.

The private `/admin` page accepts `CRON_SECRET`, exchanges it for a signed, `HttpOnly`, eight-hour browser
session, and reveals a manual “Generate and publish article” button. The secret is verified server-side and
is not stored in browser JavaScript. The Server Action re-authorizes every request and calls the same Hono
business path as the cron job.

The endpoint also accepts authenticated `POST` requests directly. Supply an `Idempotency-Key` of 8–128
letters, numbers, dots, underscores, colons, or hyphens when retries should resolve to the same generated
post:

```sh
curl -X POST https://your-site.example/api/blog/generate \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Idempotency-Key: manual-release-notes-2026-08"
```

Generation uses AI SDK structured output, rejects invalid or duplicate drafts, writes an immediately
published `blogPost` document to Sanity, and records provider/model/trigger metadata. Published-content
reads revalidate within the web app's existing five-minute Sanity cache window. No RAG, embeddings, or
indexing is part of this flow.

Useful commands:

```sh
pnpm dev                              # web
pnpm cron:blog                        # trigger the local blog cron against the development dataset
pnpm --filter @portfolio/studio dev   # Sanity Studio
pnpm build                            # web production build
pnpm build:all                        # all buildable workspaces
pnpm check:all                        # lint, dependency, and type checks
pnpm run check:all:build && pnpm run security:check && pnpm run security:audit
                                      # complete production verification
pnpm studio:seed                      # seed development Sanity content
pnpm --filter @portfolio/studio typegen
pnpm db:generate                      # generate a Drizzle migration
pnpm db:migrate                       # apply Drizzle migrations
```

Pull requests, merge-queue checks, and pushes to `main` run the production verification pipeline in
`.github/workflows/ci.yml`. Studio deployments run from `.github/workflows/deploy-studio.yml`: `dev`
targets the development GitHub environment and `main` targets production.
