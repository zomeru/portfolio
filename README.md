# Portfolio

A personal portfolio with a technical blog, GitHub activity, and Ask Zomer AI. Sanity manages published content, while PostgreSQL supports grounded portfolio retrieval and chat persistence.

## Tech stack

The project uses:

- **Runtime and tooling**: Node.js 24.19.x, pnpm 11.24.0, Turborepo 2+, TypeScript 7 with the TypeScript 6 compatibility API, Oxfmt, and Oxlint
- **Frontend**: Next.js 16+, React 19+, Tailwind CSS 4+, and React Compiler
- **API**: Hono 4+
- **Content**: Sanity Studio 6+, Sanity Client 7+, GROQ, Portable Text, and TypeGen
- **Agent interfaces**: OpenAPI 3.2, REST `/api/v1`, and stateless Streamable HTTP MCP
- **Data**: PostgreSQL, Neon, Drizzle ORM, pgvector, full-text search, and HNSW
- **AI**: AI SDK 7+, Gemini blog generation, Groq, NVIDIA NIM, or OpenRouter chat, and OpenRouter embeddings
- **Observability**: OpenTelemetry and optional Langfuse tracing

Development logs color warnings and errors. Production emits structured, redacted JSON with request context, error details, and the originating application frame.

## Architecture

`apps/web` is the only deployed process. It serves the Next.js UI, mounts the Hono app from `apps/api`, and hosts the MCP transports. `apps/api` owns the canonical published-portfolio service shared by the website, REST API, OpenAPI contract, and MCP tools. Ask Zomer uses the derived portfolio index for portfolio questions and can use provider web search for general questions when Groq or OpenRouter is selected.

Blog publication creates an idempotent PostgreSQL event after Sanity succeeds. Email, Web Push, and webhook deliveries run independently, so provider failures never roll back a published post. The protected admin page retries incomplete or transient deliveries.

| Workspace                    | Responsibility                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `apps/web`                   | Deployed Next.js UI, Hono adapter, metadata, discovery routes, and MCP servers |
| `apps/api`                   | Hono routes and server-side portfolio, AI, GitHub, and notification services   |
| `apps/studio`                | Sanity Studio, schemas, fixtures, structure, and TypeGen                       |
| `packages/database`          | Drizzle schema, migrations, and repository-only application data access        |
| `packages/env`               | Runtime-scoped, type-safe environment parsing                                  |
| `packages/content`           | Generated-blog limits shared by API validation and Studio guardrails           |
| `packages/typescript-config` | Shared base and Next.js TypeScript presets                                     |

Turbo boundary checks reject undeclared dependencies and imports that reach across package file boundaries. Browser code imports API types through `@portfolio/api/types`; server callers use the in-process API entrypoint.

## Notifications

- **Email**: Gmail SMTP by default or Resend, with confirmation and signed unsubscribe links
- **Web Push**: explicit browser opt-in through a small Progressive Web App (PWA) service worker
- **Webhooks**: admin-approved Discord, Slack, or signed generic HTTPS destinations with server-side request forgery (SSRF) protection

Notification schemas and migrations live in `packages/database`. See `/developers` for webhook payloads, signature verification, retries, and local testing.

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

| Service               | Variables                                                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site                  | `NEXT_PUBLIC_SITE_URL`                                                                                                                                                  |
| Sanity                | `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_APP_ID`, `SANITY_API_TOKEN`                                                          |
| GitHub                | `GH_PAT_TOKEN`                                                                                                                                                          |
| Database              | `DATABASE_URL`, optional `DATABASE_DIRECT_URL`                                                                                                                          |
| Blog AI               | `GOOGLE_GENERATIVE_AI_API_KEY`, `GOOGLE_GENERATIVE_AI_MODEL`                                                                                                            |
| Ask Zomer providers   | `AI_CHAT_PROVIDER`, `GROQ_API_KEY`, `NVIDIA_NIM_API_KEY`, `OPENROUTER_API_KEY`                                                                                          |
| Ask Zomer models      | `AI_GROQ_CHAT_MODEL`, `AI_NVIDIA_NIM_CHAT_MODEL`, `AI_OPENROUTER_CHAT_MODEL`, `AI_EMBEDDING_MODEL`                                                                      |
| Admin                 | `ADMIN_ACCESS_KEY`, `CRON_SECRET`, `AI_INDEX_SECRET_KEY`                                                                                                                |
| Email notifications   | `EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, optional `EMAIL_REPLY_TO` and `EMAIL_CONFIRMATION_TTL_HOURS`; Gmail: `GOOGLE_APP_PASSWORD`; Resend: `RESEND_API_KEY` |
| Web Push              | `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_SUBJECT`                                                                               |
| Notification security | `NOTIFICATION_TOKEN_SECRET`, `WEBHOOK_ENCRYPTION_KEY`                                                                                                                   |
| Tracing               | `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, optional `LANGFUSE_BASE_URL`                                                                                              |

Never expose server-only variables to browser code. Confirm the target before seeding content, publishing, migrating, indexing, or deploying.

Notification features are optional, but each enabled feature needs its complete variable group. Generate setup values without committing production secrets:

```sh
pnpm --filter @portfolio/api exec web-push generate-vapid-keys
openssl rand -base64 48
openssl rand -base64 32 | tr '+/' '-_' | tr -d '='
```

Use the first random value for `NOTIFICATION_TOKEN_SECRET` and the base64url value for `WEBHOOK_ENCRYPTION_KEY`. Keep the VAPID key pair unchanged across deployments.

### Notification setup

1. For Gmail, enable two-step verification and set `EMAIL_FROM` plus `GOOGLE_APP_PASSWORD`. For Resend, set `EMAIL_PROVIDER=resend`, `EMAIL_FROM`, and `RESEND_API_KEY`.
2. Configure the three Web Push variables with one VAPID key pair.
3. Generate the notification and webhook secrets shown above.
4. Confirm the database target, run `pnpm db:migrate`, and deploy. Use **Retry notifications** on `/admin` for eligible failures.

## Development commands

Use these commands for common development tasks:

| Command                                   | Purpose                                                           |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `pnpm dev`                                | Start the web app                                                 |
| `pnpm dev:all`                            | Start all workspace development tasks                             |
| `pnpm build`                              | Build the web app                                                 |
| `pnpm build:all`                          | Build all workspaces                                              |
| `pnpm check:all`                          | Run lint, dependency, unused-code, type, and test checks          |
| `pnpm run check:all:build`                | Run all checks and builds                                         |
| `pnpm boundaries`                         | Enforce workspace dependency and file-import boundaries           |
| `pnpm analyze`                            | Write the Next.js bundle analysis to `.next/diagnostics/analyze`  |
| `pnpm lint`                               | Check formatting with Oxfmt and lint with type-aware Oxlint       |
| `pnpm lint:fix`                           | Format with Oxfmt and apply safe Oxlint fixes                     |
| `pnpm format`                             | Format supported files with Oxfmt                                 |
| `pnpm test`                               | Run the minimal API contract, security, and complex-logic tests   |
| `pnpm --filter @portfolio/studio typegen` | Regenerate Sanity types                                           |
| `pnpm db:generate`                        | Generate a Drizzle migration                                      |
| `pnpm db:migrate`                         | Apply database migrations                                         |
| `pnpm ai:index`                           | Update the published-content index                                |
| `pnpm ai:index --force`                   | Rebuild the full AI index                                         |
| `pnpm ai:eval`                            | Run deterministic assistant evaluations                           |
| `pnpm security:secrets`                   | Scan the Git repository for new secrets with GitGuardian ggshield |

Run database, seed, publish, and indexing commands only against a confirmed target.

Bundle analysis uses Next.js's built-in experimental analyzer and is intentionally manual: the repository does not impose a brittle size threshold without a stable production baseline.

### Local security scanning

The secrets scan requires the standalone GitGuardian CLI; it is not a pnpm dependency. On macOS,
install and authenticate ggshield with:

```sh
brew install ggshield
ggshield auth login
```

Run `pnpm security:secrets` to scan the repository and its commit history. The command ignores
secrets already known to the authenticated GitGuardian dashboard, such as remediated historical
incidents, but still fails when it detects a new secret. GitGuardian uses its API and requires
authentication. Files larger than GitGuardian's one-megabyte document limit are reported as skipped.
See the official [ggshield setup guide](https://docs.gitguardian.com/ggshield-docs/getting-started)
for other operating systems and installation options.

## Public agent interfaces

Published Sanity content is normalized once in `@portfolio/api/public-portfolio` and shared by every public interface. Explicit DTOs exclude drafts, Sanity internals, embeddings, admin metadata, and secrets.

| Resource                                                    | Purpose                                                  |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| `/api/v1/*`, `/openapi.json`                                | Public REST resources and generated OpenAPI 3.2 contract |
| `/api/mcp`, `/api/mcp/docs`                                 | Read-only Streamable HTTP MCP servers                    |
| `/.well-known/*`, `/auth.md`, `/llms.txt`, `/llms-full.txt` | Machine-readable discovery and usage guidance            |
| `/robots.txt`, `/sitemap.xml`                               | Search and crawler discovery                             |
| `/schemamap.xml`, `/structured-data/portfolio.jsonl`        | NLWeb schema map and schema.org JSON Lines feed          |
| `/developers`, `/developers.md`, `/developers/llms.txt`     | Human and agent integration guides                       |

No authentication is required. Clients should not send credentials. Canonical URLs come from `NEXT_PUBLIC_SITE_URL`; REST responses use scoped permissive CORS and a five-minute public-content cache.
