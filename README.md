# Portfolio

Personal portfolio with a technical blog, GitHub activity, and Ask Zomer AI chat. Sanity owns
published content. Neon PostgreSQL and pgvector support retrieval, conversations, and notification
delivery state.

- `apps/web` runs TanStack Start, React, and Tailwind on Cloudflare Workers. It owns SSR, discovery
  endpoints, and the stateless MCP transports.
- `apps/api` owns Hono routes, authorization, indexing, publishing, and the canonical public
  portfolio contract. The Worker mounts Hono at `/api` and SSR uses an in-process typed client.
- `apps/studio` owns Sanity Studio and TypeGen. `packages/database` owns Drizzle and migrations.

## Local development

Use the Node version in `.node-version` and the pnpm version pinned in `package.json`.

```sh
cp .env.example .env.local
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm ai:index
pnpm dev
```

Set real values for the features you want to test and remove placeholder values for unused features.
Set `DATABASE_URL` and `DATABASE_DIRECT_URL` to your loopback PostgreSQL database before
running migrations or development indexing. Install pgvector on that PostgreSQL server first.
The migration enables the extension in the selected database. `pnpm ai:index` seeds the derived
index from published documents in the development Sanity dataset. It requires OpenRouter access.
The development database starts with empty conversations, deliveries, and subscriptions.

Use development Sanity targets for mutation testing. The dev Worker, Studio, and
repository CLI commands read the root `.env.local` by default. Run
`pnpm --filter @portfolio/web run dev --mode production` to use `.env.production.local` for the
dev Worker. A Worker-specific `apps/web/.dev.vars` takes precedence. Create that file before
building when testing with `pnpm preview`.
Use `SITE_URL`, `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_APP_ID`, and
`WEB_PUSH_VAPID_PUBLIC_KEY` for runtime configuration. `SITE_URL` defaults to
`http://localhost:3000` in development. The browser receives the canonical origin through SSR
and the VAPID public key through the notification API. Reserve Vite's `VITE_` prefix for public
build-time values.

| Command                                      | Purpose                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm dev`                                   | Run the Worker at http://localhost:3000 with HMR                                      |
| `pnpm dev:all`                               | Run the Worker and Sanity Studio                                                      |
| `pnpm build`                                 | Build and type-check the staging Worker                                               |
| `pnpm run build:production`                  | Build and type-check the production Worker                                            |
| `pnpm preview`                               | Serve the last Worker build locally with workerd                                      |
| `pnpm cf:typegen`                            | Generate local Worker binding and runtime types                                       |
| `pnpm check:all:build`                       | Run formatting, lint, boundaries, dependency checks, types, tests, and builds         |
| `pnpm security:check && pnpm security:audit` | Audit the full and production dependency graphs                                       |
| `pnpm run deploy:staging --dry-run`          | Build and check the staging Worker bundle                                             |
| `pnpm run deploy:production --dry-run`       | Build and check the production Worker bundle                                          |
| `pnpm cron:blog`                             | Exercise the authorized blog endpoint against a development dataset and loopback host |

Dependencies used by more than one workspace take their version from the `catalog:` in
`pnpm-workspace.yaml`; reference them as `"catalog:"` in manifests. The catalog pins TypeScript
7.1 Beta. Its remaining `overrides` are security floors for Sanity CLI transitive dependencies.
CI applies the full migration history to an isolated PostgreSQL 18 and pgvector 0.8.7 instance
before running the database integration tests. Run the three commands below against a disposable
loopback database named `portfolio_test_*` by setting `DATABASE_URL` in your shell.

```sh
pnpm --filter @portfolio/database run db:check:ci
pnpm --filter @portfolio/database run db:migrate:ci
pnpm --filter @portfolio/database run test:integration
```

Public routes use unprefixed English URLs and `/ja`, `/zh-CN`, or `/de` prefixes. The Worker
detects locale using the saved preference, then language and country. Public pages that depend on
Sanity use SSR. Selected anonymous responses can reuse a render for 60 seconds in the local
Cloudflare data center; social images are cached for five minutes. Locale-prefixed pages share
these entries, and the preference cookie is added per response. Client navigation reuses loader
data for the same 60 seconds. Each Worker version gets fresh cache keys. Sanity remains
authoritative, and publishing requires no cache webhook or rebuild. Private and request-specific
responses are uncached.

The build prerenders the source-owned discovery documents using the target's configured
`SITE_URL`. Cloudflare serves these and the fingerprinted JS, CSS, and fonts as static assets
without invoking the app Worker.

## Cloudflare deployment

`apps/web/wrangler.jsonc` defines both deployment targets, their custom domains, and non-sensitive
runtime variables. Use a Cloudflare account that manages the `zomeru.dev` zone.

### GitHub integration

Connect the same GitHub repository to both Workers in Cloudflare Workers Builds. Configure each
Worker with its own production branch so pushes to that branch update its custom domain.
If a Worker is missing, the matching `wrangler secret bulk` command below can provision it before
you connect GitHub.

| Environment | Worker              | Custom domain        | Production branch | Deploy command               |
| ----------- | ------------------- | -------------------- | ----------------- | ---------------------------- |
| Production  | `portfolio`         | `zomeru.dev`         | `main`            | `pnpm run deploy:production` |
| Staging     | `portfolio-staging` | `preview.zomeru.dev` | `dev`             | `pnpm run deploy:staging`    |

Set the root directory to `apps/web` for both Workers. Leave the separate build command blank since
the deploy command builds the matching environment and uploads that bundle. Disable non-production
branch builds when using the two fixed domains above.

If Workers Builds stops while installing the pinned Node release, use the build image's preinstalled
Node as the launcher. Set the build variables `NODE_VERSION=24.22.1` and
`SKIP_DEPENDENCY_INSTALL=1`. Set the deploy command to `bash scripts/workers-build.sh production`
or `bash scripts/workers-build.sh staging`. The script downloads and verifies the Node version in
`.node-version`, enables the pinned pnpm through Corepack, and runs the matching deploy command.

The GitHub Actions CI workflow checks both bundles with `--dry-run`.
The separate Sanity Studio workflow uses `SANITY_PROJECT_ID` and `SANITY_APP_ID` as optional
GitHub variable overrides. Set the GitHub Actions secret `SANITY_AUTH_TOKEN` to a Sanity deploy
token with schema deployment access for both Studio workspaces.

### Runtime secrets

In the Cloudflare dashboard, open each Worker and go to **Settings → Variables & Secrets**. Add
runtime credentials there as **Secret** entries. Use `.env.example` as the key reference and give
staging its own Neon connection, Sanity token scoped to the `development` dataset, and signing keys.
Both Workers need `SANITY_API_TOKEN` to render pages. The production Worker uses the `production`
dataset. Keep `DATABASE_DIRECT_URL` with migration tooling. Local development continues to read
`.env.local` or the Worker-specific `.dev.vars`.

Fill in the commented `vars` entries in `apps/web/wrangler.jsonc` for optional integrations when
you have real values and the corresponding secrets for that Worker.

For bulk upload, prepare separate private dotenv files outside the repository with only the Worker
secrets needed for each environment. Run these commands from `apps/web`.

```sh
pnpm exec wrangler login
pnpm exec wrangler secret bulk --env staging /secure/path/staging-secrets.env
pnpm exec wrangler secret bulk --env production /secure/path/production-secrets.env
```

For manual deployment, run `pnpm run deploy:staging` or `pnpm run deploy:production`. Verify the
custom domain, canonical URLs, and the static `/openapi.json` for each environment. Disable any
existing Sanity webhook pointed at `/api/revalidate/sanity` after rolling out this change; the
endpoint and its signing secret are retired.
Run `pnpm run versions:upload` or `pnpm run versions:upload:production` to build and upload a Worker
version for later deployment.
Only production runs the blog cron at `0 22 * * TUE,THU,SAT` (6:00 a.m. Wednesday, Friday, and
Sunday in Manila). The job key comes from the scheduled time in UTC. Each environment has its own
Cloudflare chat rate-limit namespace. Cloudflare limits chat requests per client IP and location,
and PostgreSQL keeps the per-session limits. Google Tag Manager loads in production builds.

Slack and Discord use HTTPS from the Worker. For generic webhooks, run
`pnpm --filter @portfolio/api run start:webhook-relay` on a Node host with the same
`WEBHOOK_RELAY_SECRET`. Put the relay behind HTTPS, forward its root path, and set
`WEBHOOK_RELAY_URL` on the Worker. The relay resolves and pins public IPs and rejects redirects
and private destinations. Its default listener is `127.0.0.1:8788` and accepts `HOST` and `PORT`.
Gmail uses SMTP over TLS and Resend uses HTTPS.

## Embedding rollout and rollback

Ask Zomer and blog similarity use OpenRouter's `nvidia/nemotron-3.5-embed-8b:free` with 4,096
dimensions. The new tables keep full-precision embeddings, exact cosine search, and a separate
full-text GIN index. pgvector HNSW supports at most 2,000 dimensions for `vector` and 4,000 for
`halfvec`. Exact search preserves recall on the current portfolio corpus. If it becomes a
measured bottleneck, benchmark a subvector or binary HNSW index with full-vector reranking.

1. Hold automatic Worker deployment until the new index is ready. Apply the additive migrations
   to the target PostgreSQL instance while the previous Worker serves the legacy index.
2. Run the new revision's `pnpm ai:index` against the staging database and its development Sanity
   dataset first. For production, confirm the database and dataset in the private
   `.env.production.local` and run `pnpm ai:index:prod` from the new revision.
3. Run the same command again after an interruption or OpenRouter quota reset. Each completed
   document commits atomically, and the next run skips matching content hashes. Compare the
   documents scanned to the published portfolio. The summary counts provider-rejected documents
   separately. Those documents remain available to keyword and structured retrieval.
4. Verify search and chronology against the new index, then deploy the matching Worker. Roll back
   with the last Worker version if needed. The legacy tables and vectors remain available.

Use `--force` when intentionally rebuilding the entire active index. For a provider-rejected
document, an editorial change to published content is picked up on the next incremental run.
Use the corpus summary and retrieval tests to assess coverage before promoting a Worker.

## Generated articles

Blog generation uses Google Gemini 4 Hydrogen with low reasoning and structured output. Published
titles, excerpts, and headings inform topic selection. A PostgreSQL lease serializes generation
per Sanity project and dataset, and Sanity document IDs are deterministic for a generation key.
Both the scheduled job and authenticated requests follow this path. Duplicate checks compare slugs,
titles, outlines, overlapping text, and separate topic and body embeddings. Cached fingerprints
track the Sanity revision, so interrupted corpus preparation resumes without repeating completed
work. Provider-rejected fingerprints remain eligible for text comparison. Publication, indexing,
and notification dispatch retain separate outcomes.

For previously published duplicates, review the candidates in the
[modernization plan](IMPLEMENTATION_PLAN.md#production-blog-audit). Choose a canonical article
after comparing correctness, incoming links, and what each version adds. Preserve useful material
during consolidation. For distinct public URLs, add a permanent redirect before unpublishing an
alternate. For repeated slugs, compare the associated Sanity documents and retain the intended
public version.

## Dependency compatibility

- Drizzle ORM and Kit use `1.0.0-rc.6` together, with the generated snapshot format from
  `drizzle-kit up`. Loopback PostgreSQL uses the Drizzle wire driver and hosted Neon uses Drizzle
  Neon HTTP. Both preserve atomic batched writes.
- OpenTelemetry API stays at `1.9.1` while the trace SDK requires `<1.10`. Upgrade the trace
  SDK and Langfuse together when their peer ranges accept the newer API.
