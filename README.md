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
pnpm dev
```

Set real values for the features you want to test and remove placeholder values for unused features.
Use development Sanity and Neon targets for mutation testing. The dev Worker, Studio, and
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

Public routes use unprefixed English URLs and `/ja`, `/zh-CN`, or `/de` prefixes. The Worker
detects locale using the saved preference, then language and country. Mutable Sanity reads go
directly to the published Content Lake and share identical queries within a request. The signed
Sanity webhook still validates the source and reports affected content tags. The next request reads
current content without a shared application cache to purge. Hashed frontend assets are immutable,
and admin responses are private and uncached.

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
custom domain and the signed Sanity webhook at `/api/revalidate/sanity` for each environment.
Run `pnpm run versions:upload` or `pnpm run versions:upload:production` to build and upload a Worker
version for later deployment.
Only production runs the blog cron at `0 22 * * TUE,THU,SAT` (6:00 a.m. Wednesday, Friday, and
Sunday in Manila). Disable the old scheduler at cutover to avoid duplicate invocations.

Slack and Discord use HTTPS from the Worker. For generic webhooks, run
`pnpm --filter @portfolio/api run start:webhook-relay` on a Node host with the same
`WEBHOOK_RELAY_SECRET`. Put the relay behind HTTPS, forward its root path, and set
`WEBHOOK_RELAY_URL` on the Worker. The relay resolves and pins public IPs and rejects redirects
and private destinations. Its default listener is `127.0.0.1:8788` and accepts `HOST` and `PORT`.
Gmail uses SMTP over TLS and Resend uses HTTPS.

## Dependency compatibility

- Drizzle ORM and Kit remain at `1.0.0-rc.4`. The current stable 0.x releases precede the existing
  1.x migration format. Upgrade both together when a stable 1.x pair can verify the migration
  history and transactional Neon queries.
- OpenTelemetry API stays at `1.9.1` while the trace SDK requires `<1.10`. Upgrade the trace
  SDK and Langfuse together when their peer ranges accept the newer API.
