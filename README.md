# Portfolio

A personal portfolio with a technical blog, GitHub activity, and Ask Zomer, a grounded AI assistant. Sanity manages published content, and PostgreSQL supports AI retrieval and chat persistence.

## Tech stack

The project uses:

- **Runtime and tooling**: Node.js 24+, pnpm 11+, Turborepo 2+, TypeScript 6+, and Biome 2+
- **Frontend**: Next.js 16+, React 19+, Tailwind CSS 4+, and React Compiler
- **API**: Hono 4+
- **Content**: Sanity Studio 6+, Sanity Client 7+, GROQ, Portable Text, and TypeGen
- **Agent interfaces**: OpenAPI 3.2, REST `/api/v1`, and stateless Streamable HTTP MCP
- **Data**: PostgreSQL, Neon, Drizzle ORM, pgvector, full-text search, and HNSW
- **AI**: AI SDK 7+, Google Gemini, and OpenRouter
- **Observability**: OpenTelemetry and optional Langfuse tracing

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
| `pnpm check:all` | Run lint, dependency, unused-code, type, and contract checks |
| `pnpm run check:all:build` | Run all checks and builds |
| `pnpm test` | Run serializer, REST, OpenAPI, MCP protocol, and discovery tests |
| `pnpm --filter @portfolio/studio typegen` | Regenerate Sanity types |
| `pnpm db:generate` | Generate a Drizzle migration |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm ai:index` | Update the published-content index |
| `pnpm ai:index --force` | Rebuild the full AI index |
| `pnpm ai:eval` | Run deterministic assistant evaluations |

Run database, seed, publish, and indexing commands only against a confirmed target.

## Public agent interfaces

Published Sanity content is normalized once in `@portfolio/api/public-portfolio` and shared by the
website, REST API, and MCP server. The boundary uses explicit public DTOs and never returns drafts,
Sanity internals, embeddings, admin metadata, or secrets.

| Resource | Purpose |
| --- | --- |
| `/api/v1` | Versioned machine-readable API index |
| `/api/v1/profile`, `/resume`, `/experience`, `/projects`, `/blogs`, `/tech-stack` | Public JSON resources |
| `/api/v1/blogs/{slug}` | Published blog detail by canonical slug |
| `/openapi.json` | Generated OpenAPI 3.2 contract |
| `/api/mcp` | Read-only Streamable HTTP portfolio MCP server |
| `/api/mcp/docs` | Read-only documentation MCP server |
| `/.well-known/api-catalog` | RFC 9727 Linkset catalog |
| `/.well-known/mcp/*.json` | MCP server cards |
| `/.well-known/agent-skills/index.json` | Machine-readable capability index |
| `/developers`, `/developers.md`, `/developers/llms.txt` | Human and agent integration guides |

No authentication is required. Clients should not send credentials. Canonical URLs come from
`NEXT_PUBLIC_SITE_URL`; REST responses use scoped permissive CORS and public caching with a five-minute
Sanity revalidation window.
