# Portfolio

Personal portfolio, technical blog, GitHub activity viewer, and grounded AI assistant in a pnpm
monorepo. Sanity is the source of truth for published portfolio content; PostgreSQL stores the
derived AI search index, anonymous chat history, retrieval events, and ingestion state.

## Stack

- Node.js 24+, pnpm 11.22.0, Turborepo 2.10.11, TypeScript 6.0.3, and Biome 2.5.9
- Next.js 16.3.1, React 19.2.8, Tailwind CSS 4, and React Compiler
- Hono 4.13.3 embedded in the Next.js deployment
- Sanity Studio 6.10.1, `next-sanity` 13.3.3, and GROQ TypeGen
- PostgreSQL/Neon, Drizzle ORM and Kit 1.0.0-rc.4, pgvector, full-text search, and HNSW
- AI SDK 7.0.74, Google Gemini for blog generation, and OpenRouter for chat and embeddings
- OpenTelemetry and optional Langfuse tracing

## Workspaces

| Workspace | Responsibility |
| --- | --- |
| `apps/web` | Next.js App Router site, admin UI, metadata, OG images, and Hono adapter |
| `apps/api` | Hono routes and server-side GitHub, AI, RAG, indexing, and publishing logic |
| `apps/studio` | Sanity Studio, schemas, desk structure, seed data, and web type generation |
| `packages/content` | Shared blog field and generation limits |
| `packages/database` | Drizzle client, PostgreSQL schema, repositories, and migrations |
| `packages/env` | Runtime-scoped Zod environment validation |
| `packages/typescript-config` | Shared TypeScript presets |

## Architecture

`apps/web/src/app/api/[[...route]]/route.ts` exposes the Hono app from `@portfolio/api` through
`hono/vercel`. The API is a source-exported internal package, so there is no separate API server or
build. Server Components and Server Actions call it in-process through `apiApp.request`; browser
code uses the type-inferred Hono client over `/api`.

The public pages read published Sanity documents for the profile, experience, projects, tech-stack
groups, and Markdown blog posts. The standalone Studio provides production and development
workspaces. Web reads use a five-minute revalidation window by default; blog slug discovery and the
generated `llms.txt` endpoints revalidate hourly.

Ask Zomer AI classifies each question, retrieves structured, vector, and full-text candidates for
portfolio questions, fuses the results, and streams an answer with citations. General questions skip
retrieval. Anonymous session IDs live in browser storage while sessions, messages, citations,
suggestions, retrieval events, and rate-limit history persist in PostgreSQL. The knowledge index uses
2,048-dimension embeddings and a cosine HNSW index over `halfvec(2048)`.

## Local setup

Install Node.js 24+ and pnpm 11.22.0, then create the local environment file and install dependencies:

```sh
cp .env.example .env.local
pnpm install
pnpm dev
```

The root scripts load `.env.local`. Configure only the services needed for the path being run:

| Variables | Used by |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs; defaults to `http://localhost:3000` locally and is required in production |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_APP_ID` | Web and Studio Sanity target; repository defaults exist, but deployments should set the dataset explicitly |
| `SANITY_API_TOKEN` | Authenticated published reads, seeding, generated-post writes, and AI indexing |
| `GH_PAT_TOKEN` | Server-only GitHub contribution and commit APIs |
| `GOOGLE_GENERATIVE_AI_API_KEY`, `GOOGLE_GENERATIVE_AI_MODEL` | AI blog generation |
| `CRON_SECRET` | Vercel Cron and blog-publishing admin capability; minimum 32 characters |
| `DATABASE_URL` | Application PostgreSQL connection |
| `DATABASE_DIRECT_URL` | Optional direct connection for Drizzle CLI operations |
| `OPENROUTER_API_KEY`, `AI_CHAT_MODEL`, `AI_EMBEDDING_MODEL` | Ask Zomer chat, embeddings, indexing, and AI-admin capability; model IDs have defaults |
| `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL` | Optional tracing; configure both keys or neither |

Do not expose server-only variables to browser code. Confirm the Sanity dataset or database target
before any seed, publish, migration, push, or deployment command.

## Commands

```sh
pnpm dev                              # Next.js development server
pnpm dev:all                          # all workspace development tasks
pnpm build                            # web production build
pnpm build:all                        # all buildable workspaces
pnpm check:all                        # Biome, dependency, unused-code, and type checks
pnpm run check:all:build              # checks plus all builds
pnpm run check:all:build && pnpm run security:check && pnpm run security:audit
                                      # production verification pipeline

pnpm --filter @portfolio/studio dev   # Sanity Studio
pnpm --filter @portfolio/studio typegen
pnpm --filter @portfolio/studio seed --dry-run

pnpm db:generate                      # generate a Drizzle migration
pnpm db:check                         # validate migration consistency
pnpm db:migrate                       # apply migrations; confirm the target first

pnpm ai:index                         # incremental published-content index
pnpm ai:index --force                 # rebuild all documents and embeddings
pnpm ai:eval                          # deterministic intent/strategy evaluation
pnpm ai:eval --live                   # retrieval Hit@6/MRR and grounded-answer checks
pnpm cron:blog                        # invoke the local scheduled-generation path
```

There is no general unit-test suite. Repository verification is currently Biome, dependency checks,
TypeScript, builds, security audits, and the assistant evaluation harness.

## Content, automation, and admin

Vercel Cron calls `GET /api/blog/generate` at 22:00 UTC every Tuesday, Thursday, and Saturday. Both
scheduled `GET` and manual `POST` generation require `Authorization: Bearer $CRON_SECRET`; manual
requests may provide an 8–128 character `Idempotency-Key`. Generation validates structured output,
rejects duplicate titles or slugs, creates an immediately published Sanity `blogPost`, records
generation metadata, and then attempts a best-effort single-document Ask Zomer index update. A failed
index update does not roll back the published article.

The private `/admin` page has separate eight-hour, signed, `HttpOnly`, `SameSite=Strict` capability
sessions: `CRON_SECRET` unlocks blog publishing and `OPENROUTER_API_KEY` unlocks AI reindexing. Every
mutation re-authorizes server-side. Full indexing is incremental by content hash unless forced, removes
documents no longer published, refuses an empty-source stale deletion, and uses a database lock to
prevent concurrent runs. Ordinary Sanity edits are not webhook-indexed; run a reindex after publishing
them.

When both Langfuse keys are configured, Node instrumentation exports AI SDK generations plus custom
chat, retrieval, ingestion, and publishing spans; the base URL has a default. Chat and blog generation
explicitly record model inputs and outputs; evaluation generations explicitly disable them. Treat
traced prompts, portfolio context, and responses as data sent to the configured Langfuse project.

## Discovery and deployment

The App Router implements canonical metadata, route-specific Open Graph and Twitter images, icons, a
web manifest, `robots.txt`, a sitemap containing public pages and published blog slugs, and generated
`/llms.txt` and `/llms-full.txt` indexes. Robots exclude `/admin` and `/api/`.

Relevant pull requests, merge-queue runs, and pushes to `main` execute checks, all builds, and both
dependency audits in `.github/workflows/ci.yml`; documentation-only changes are skipped. Studio changes
deploy the development workspace from `dev` and production from `main`. Database changes on `dev` or
`main` validate and apply Drizzle migrations through the matching GitHub environment. `vercel.json`
places the web functions in `sin1` and defines the blog cron schedule.
