# Portfolio

A personal portfolio with a technical blog, GitHub activity, and Ask Zomer AI. Sanity manages published content, while PostgreSQL supports grounded portfolio retrieval and chat persistence.

## Tech stack

The project uses:

- **Runtime and tooling**: Node.js 24.19.x, pnpm 11.22.0, Turborepo 2+, TypeScript 6+, and Biome 2+
- **Frontend**: Next.js 16+, React 19+, Tailwind CSS 4+, and React Compiler
- **API**: Hono 4+
- **Content**: Sanity Studio 6+, Sanity Client 7+, GROQ, Portable Text, and TypeGen
- **Agent interfaces**: OpenAPI 3.2, REST `/api/v1`, and stateless Streamable HTTP MCP
- **Data**: PostgreSQL, Neon, Drizzle ORM, pgvector, full-text search, and HNSW
- **AI**: AI SDK 7+, Gemini blog generation, Groq, NVIDIA NIM, or OpenRouter chat, and OpenRouter embeddings
- **Observability**: OpenTelemetry and optional Langfuse tracing

## Architecture

`apps/web` is the only deployed process. It serves the Next.js UI, mounts the Hono app from `apps/api`, and hosts the MCP transports. `apps/api` owns the canonical published-portfolio service shared by the website, REST API, OpenAPI contract, and MCP tools. Ask Zomer uses the derived portfolio index for portfolio questions and can use provider web search for general questions when Groq or OpenRouter is selected.

## Local setup

Use the Node.js and pnpm versions declared in `package.json`. Then create your local environment and start the web app:

```sh
cp .env.example .env.local
pnpm install
pnpm dev
```

The site runs at [http://localhost:3000](http://localhost:3000). Start every workspace with `pnpm dev:all`, or run Sanity Studio on its own:

```sh
pnpm --filter @portfolio/studio dev
```

## Environment variables

`.env.example` is the source of truth. Add only the services needed for your development path:

| Service | Variables |
| --- | --- |
| Site | `NEXT_PUBLIC_SITE_URL` |
| Sanity | `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_APP_ID`, `SANITY_API_TOKEN` |
| GitHub | `GH_PAT_TOKEN` |
| Database | `DATABASE_URL`, optional `DATABASE_DIRECT_URL` |
| Blog AI | `GOOGLE_GENERATIVE_AI_API_KEY`, `GOOGLE_GENERATIVE_AI_MODEL` |
| Ask Zomer providers | `AI_CHAT_PROVIDER`, `GROQ_API_KEY`, `NVIDIA_NIM_API_KEY`, `OPENROUTER_API_KEY` |
| Ask Zomer models | `AI_GROQ_CHAT_MODEL`, `AI_NVIDIA_NIM_CHAT_MODEL`, `AI_OPENROUTER_CHAT_MODEL`, `AI_EMBEDDING_MODEL` |
| Admin | `CRON_SECRET`, `AI_INDEX_SECRET_KEY` |
| Tracing | `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, optional `LANGFUSE_BASE_URL` |

Never expose server-only variables to browser code. Confirm the target before seeding content, publishing, migrating, indexing, or deploying.

## Development commands

Use these commands for common development tasks:

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the web app |
| `pnpm dev:all` | Start all workspace development tasks |
| `pnpm build` | Build the web app |
| `pnpm build:all` | Build all workspaces |
| `pnpm check:all` | Run lint, dependency, unused-code, type, and test checks |
| `pnpm run check:all:build` | Run all checks and builds |
| `pnpm test` | Run public API, MCP, discovery, and SEO contract tests |
| `pnpm --filter @portfolio/studio typegen` | Regenerate Sanity types |
| `pnpm db:generate` | Generate a Drizzle migration |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm ai:index` | Update the published-content index |
| `pnpm ai:index --force` | Rebuild the full AI index |
| `pnpm ai:eval` | Run deterministic assistant evaluations |

Run database, seed, publish, and indexing commands only against a confirmed target.

## Public agent interfaces

Published Sanity content is normalized once in `@portfolio/api/public-portfolio` and shared by every public interface. Explicit DTOs exclude drafts, Sanity internals, embeddings, admin metadata, and secrets.

| Resource | Purpose |
| --- | --- |
| `/api/v1/*`, `/openapi.json` | Public REST resources and generated OpenAPI 3.2 contract |
| `/api/mcp`, `/api/mcp/docs` | Read-only Streamable HTTP MCP servers |
| `/.well-known/*`, `/auth.md`, `/llms.txt`, `/llms-full.txt` | Machine-readable discovery and usage guidance |
| `/robots.txt`, `/sitemap.xml` | Search and crawler discovery |
| `/schemamap.xml`, `/structured-data/portfolio.jsonl` | NLWeb schema map and schema.org JSON Lines feed |
| `/developers`, `/developers.md`, `/developers/llms.txt` | Human and agent integration guides |

No authentication is required. Clients should not send credentials. Canonical URLs come from `NEXT_PUBLIC_SITE_URL`; REST responses use scoped permissive CORS and a five-minute public-content cache.
