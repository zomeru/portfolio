# Deployment and embedding backfill

GitHub Actions releases the production Worker on [zomeru.dev](https://zomeru.dev). Cloudflare Workers Builds releases staging on [preview.zomeru.dev](https://preview.zomeru.dev). Both targets are defined in [Wrangler](apps/web/wrangler.jsonc).

## Release production

Disconnect the production `portfolio` Worker’s Git integration under **Settings → Build** before enabling the GitHub release. In GitHub, configure the **Production** environment. [Cloudflare build settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) · [GitHub environments](https://github.com/zomeru/portfolio/settings/environments)

| Setting                 | Kind            | Value                                                                                        |
| ----------------------- | --------------- | -------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | Secret          | Production Neon connection for the backfill                                                  |
| `DATABASE_DIRECT_URL`   | Optional secret | Direct connection to the same database for migrations                                        |
| `SANITY_API_TOKEN`      | Secret          | Read access to the published production Sanity dataset. An existing repository secret works. |
| `OPENROUTER_API_KEY`    | Secret          | OpenRouter key for the embedding backfill                                                    |
| `CLOUDFLARE_API_TOKEN`  | Secret          | **Edit Cloudflare Workers** token scoped to the production account and `zomeru.dev` zone     |
| `CLOUDFLARE_ACCOUNT_ID` | Variable        | ID of the account that owns the Worker                                                       |

Create the Cloudflare token under **Manage Account → API Tokens**. Copy the account ID under **Workers & Pages → Account Details**. [Token setup](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/#api-token) · [Find your account ID](https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/#find-account-id-in-workers-pages)

On a qualifying push to `main`, CI verifies the build, applies migrations, backfills embeddings through OpenRouter, and deploys the Worker. A migration or backfill failure stops deployment. To retry the current revision, select **Re-run failed jobs**. To release the latest revision, choose **Run workflow** on `main`. [Release workflow](.github/workflows/ci.yml)

After deployment, verify the custom domain, canonical URLs, `/openapi.json`, and Ask Zomer search. If needed, roll back to the previous Worker version, which can still use the previous index.

## Backfill embeddings

The Worker and indexing CLI use OpenRouter’s `nvidia/nemotron-3.5-embed-8b:free` model with 4,096 dimensions. OpenRouter lists this endpoint under NVIDIA’s trial terms, which restrict production use of the free service and its outputs. [Model and terms](https://openrouter.ai/nvidia/nemotron-3.5-embed-8b:free)

Run `pnpm ai:index` locally. Production CI runs `pnpm ai:index:prod --require-documents` after migrations and reuses completed documents on retry. Every backfill spaces requests and retries at least four seconds apart, leaving room under OpenRouter’s 20 requests per minute. OpenRouter’s daily cap is normally 50 free-model requests, or 1,000 in the higher credit tier. Retry after the quota resets if you hit it. For an authorized manual run, put the production database, Sanity dataset, and OpenRouter credentials in `.env.production.local`. [OpenRouter limits](https://openrouter.ai/docs/api_reference/limits)

## Release staging and Studio

Staging deploys the `portfolio-staging` Worker from `dev` via Cloudflare Workers Builds. Use `apps/web` as the root, leave the build command blank, and set the deploy command to `pnpm run deploy:staging`. The [database workflow](.github/workflows/migrate-db.yml) automatically applies database changes on `dev` and supports manual runs on both branches.

If Workers Builds cannot install the pinned Node release, set `NODE_VERSION=24.22.1` and `SKIP_DEPENDENCY_INSTALL=1`, then use `bash scripts/workers-build.sh staging` as the deploy command. [Build launcher](apps/web/scripts/workers-build.sh)

The [Studio workflow](.github/workflows/deploy-studio.yml) uses the `SANITY_AUTH_TOKEN` GitHub secret to deploy Sanity Studio. `SANITY_PROJECT_ID` and `SANITY_APP_ID` are optional GitHub variable overrides.

## Configure Worker runtime secrets

Set runtime secrets under **Settings → Variables & Secrets** on each Worker. Use separate Neon connections, Sanity tokens, and signing keys for staging and production. The [environment template](.env.example) lists feature-specific credentials. Keep `DATABASE_DIRECT_URL` with the migration tooling. [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

Production runs the article cron configured in Wrangler. For generic webhook delivery, run `pnpm --filter @portfolio/api run start:webhook-relay` on a Node host, put it behind HTTPS, and set `WEBHOOK_RELAY_URL` and a shared `WEBHOOK_RELAY_SECRET` on the Worker. [Notification configuration](apps/api/AGENTS.md#feature-ownership)
