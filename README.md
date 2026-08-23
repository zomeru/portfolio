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
GH_PAT_TOKEN=...
GOOGLE_GENERATIVE_AI_API_KEY=...
GOOGLE_GENERATIVE_AI_MODEL=gemini-3.7-flash
CRON_SECRET=replace-with-at-least-32-random-characters
OPENROUTER_API_KEY=...
AI_CHAT_MODEL=thinkingmachines/inkling-small:free
AI_EMBEDDING_MODEL=nvidia/nemotron-3-embed-1b:free
# Optional observability; configure both keys or neither.
LANGFUSE_PUBLIC_KEY=...
LANGFUSE_SECRET_KEY=...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

The site URL defaults to `http://localhost:3000` in development and is required in production. Public
Sanity identifiers have repository defaults in `packages/env`.
`SANITY_API_TOKEN` is required by server-side Sanity clients; automatic generation needs a write token
scoped to the target dataset. Studio seeding refuses to write outside the `development` dataset.

## GitHub contributions

`/github-contributions` renders GitHub profile contributions and an authored-commit feed without
exposing `GH_PAT_TOKEN` to the browser. Create a fine-grained personal access token whose resource owner
is the portfolio owner's personal account, grant it access to every owned repository that should appear,
and give it read-only **Contents** permission; GitHub includes read-only Metadata access automatically.
For a classic personal access token, use the `repo` and `read:user` scopes so private repositories and
private contribution counts are available. Store the token only as the server-side `GH_PAT_TOKEN`
environment variable and give it an expiration.

The contribution calendar comes from GitHub GraphQL's `ContributionsCollection.contributionCalendar`,
so it follows GitHub's profile-contribution rules and is not reconstructed from commit records. The
default range is the last 12 months, and `contributionYears` supplies the year filter. Calendar responses
are cached in-process for one hour.

The commit feed uses REST commit search with `author:<viewer> user:<viewer>` for the all-repositories
view, or `author:<viewer> repo:<owner/repository>` for a selected repository. This provides one globally
ordered, server-paginated result set rather than merging unrelated repository pages. GitHub commit search
only indexes repository default branches and exposes at most the first 1,000 matches; the interface calls
out that limit when it applies. Owned repository discovery is cached for ten minutes and commit-search
pages for five minutes. GitHub rate-limit responses become a safe, retryable API error.

Private data is sanitized inside `apps/api` before a response is created. Private commit messages become
`Private commit`, private repository names become `Private repository`, repository filter values are
opaque numeric identifiers, and private commit URLs are removed. Public commits retain only the fields
used by the page. GitHub's author timestamp remains authoritative and is formatted server-side in
`Asia/Manila` as Philippine Time (PHT / UTC+8).

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
reads revalidate within the web app's existing five-minute Sanity cache window. Ask Zomer AI indexing is
a separate derived-data flow and is not coupled to article generation.

## Ask Zomer AI

`/ask` streams general answers directly and grounds portfolio questions in a PostgreSQL search index.
Sanity remains the source of truth. The index stores normalized documents, section-aware chunks,
2,048-dimension embeddings, full-text search data, and citation metadata. Retrieval combines structured
source filters, cosine similarity, keyword ranking, and reciprocal-rank fusion. The API persists anonymous
browser sessions and messages, then passes only a bounded recent history window to the model so follow-up
questions retain context.

Apply the generated Drizzle migrations to each intended environment before indexing. They enable pgvector,
create the assistant tables, and add a cosine HNSW expression index over `halfvec(2048)`. Changing the
embedding model is safe only when it still emits 2,048 dimensions; a dimension change requires a schema
migration and a forced reindex. Model IDs are configured with `AI_CHAT_MODEL` and `AI_EMBEDDING_MODEL`.
OpenRouter's free models have availability and rate limits outside this application's control, so production
deployments can switch models without changing application code.

Index published Sanity profile, experience, project, tech-stack, and blog content after migrating and
whenever content changes. The CLI reports each fetch, normalization, embedding, and persistence phase and
shows per-document progress while it builds the index:

```sh
pnpm ai:index          # skip documents whose deterministic content hash is unchanged
pnpm ai:index --force  # rebuild every document and embedding
pnpm ai:eval           # deterministic intent-classification evaluation
pnpm ai:eval --live    # retrieval Hit@6/MRR and grounded-answer checks; requires a migrated, indexed DB
```

The protected `/admin` page reports index counts and the latest ingestion state and can start the same
idempotent indexing flow. A database lock prevents concurrent runs. Configure all three Langfuse variables
to export AI SDK and retrieval spans through OpenTelemetry; omit them for local development without
observability. Prompt and response bodies are not recorded.

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
pnpm ai:index                         # incrementally index published portfolio knowledge
pnpm ai:eval                          # run deterministic assistant intent evaluations
```

Pull requests, merge-queue checks, and pushes to `main` run the production verification pipeline in
`.github/workflows/ci.yml`. Studio deployments run from `.github/workflows/deploy-studio.yml`: `dev`
targets the development GitHub environment and `main` targets production.
