# Deployment and embedding backfill

GitHub Actions releases the production Worker on [zomeru.dev](https://zomeru.dev). Cloudflare Workers Builds releases staging on [preview.zomeru.dev](https://preview.zomeru.dev). Both targets are defined in [Wrangler](apps/web/wrangler.jsonc).

## Release production

Disconnect the production `portfolio` Worker’s Git integration under **Settings → Build** before enabling the GitHub release. In GitHub, configure the **Production** environment. [Cloudflare build settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) · [GitHub environments](https://github.com/zomeru/portfolio/settings/environments)

| Setting                    | Kind            | Value                                                                                        |
| -------------------------- | --------------- | -------------------------------------------------------------------------------------------- |
| `DATABASE_URL`             | Secret          | Production Neon connection for the backfill                                                  |
| `DATABASE_DIRECT_URL`      | Optional secret | Direct connection to the same database for migrations                                        |
| `SANITY_API_TOKEN`         | Secret          | Read access to the published production Sanity dataset. An existing repository secret works. |
| `NVIDIA_NIM_API_KEY`       | Secret          | Bearer credential for the production embedding endpoint                                      |
| `NVIDIA_NIM_EMBEDDING_URL` | Variable        | Full HTTPS embedding endpoint reachable from GitHub Actions                                  |
| `CLOUDFLARE_API_TOKEN`     | Secret          | **Edit Cloudflare Workers** token scoped to the production account and `zomeru.dev` zone     |
| `CLOUDFLARE_ACCOUNT_ID`    | Variable        | ID of the account that owns the Worker                                                       |

Create the Cloudflare token under **Manage Account → API Tokens**. Copy the account ID under **Workers & Pages → Account Details**. [Token setup](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/#api-token) · [Find your account ID](https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/#find-account-id-in-workers-pages)

On a qualifying push to `main`, CI verifies the build, applies migrations, completes the NIM backfill, and deploys the Worker. A migration or backfill failure stops deployment. To retry the current revision, select **Re-run failed jobs**. To release the latest revision, choose **Run workflow** on `main`. [Release workflow](.github/workflows/ci.yml)

After deployment, verify the custom domain, canonical URLs, `/openapi.json`, and Ask Zomer search. If needed, roll back to the previous Worker version, which can still use the previous index.

## Get a production NIM endpoint

The endpoint URL comes from a deployed NIM service. To self-host, use NVIDIA AI Enterprise production licensing and select **Get Container** on the Nemotron Embed catalog page. Deploy it on a supported GPU and serve `nvidia/Nemotron-3.5-Embed-8B-BF16` behind HTTPS with bearer-token authentication. For managed hosting, get the URL and token from the provider after it provisions that model with production access. [NVIDIA deployment options](https://docs.api.nvidia.com/nim/docs/run-anywhere) · [Nemotron Embed container](https://catalog.ngc.nvidia.com/orgs/nim/nvidia/containers/nemotron-embed/2.4)

Set `NVIDIA_NIM_EMBEDDING_URL` to the service’s full URL, such as `https://nim.example.com/v1/embeddings`, and `NVIDIA_NIM_API_KEY` to the corresponding bearer credential. Verify the endpoint returns 4,096 floats per input with `dimensions: 4096`. [NVIDIA model card](https://build.nvidia.com/nvidia/nemotron-3_5-embed-8b/modelcard)

NVIDIA Build’s `https://integrate.api.nvidia.com/v1/embeddings` and its outputs are for testing and evaluation. The local `pnpm ai:index --nvidia` command defaults to that URL and reads the key from `.env.local`. The production workflow rejects the preview host. [NVIDIA API trial terms](https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf)

Production CI runs `pnpm ai:index:prod --nvidia --require-documents` after applying migrations. The CLI batches up to 16 passages and spaces request starts by at least two seconds. Retrying the same command reuses completed documents. For an authorized manual run, use the production database, Sanity dataset, and production NIM credentials in `.env.production.local`. The Worker uses OpenRouter for runtime embeddings.

## Release staging and Studio

Staging deploys the `portfolio-staging` Worker from `dev` via Cloudflare Workers Builds. Use `apps/web` as the root, leave the build command blank, and set the deploy command to `pnpm run deploy:staging`. The [database workflow](.github/workflows/migrate-db.yml) automatically applies database changes on `dev` and supports manual runs on both branches.

If Workers Builds cannot install the pinned Node release, set `NODE_VERSION=24.22.1` and `SKIP_DEPENDENCY_INSTALL=1`, then use `bash scripts/workers-build.sh staging` as the deploy command. [Build launcher](apps/web/scripts/workers-build.sh)

The [Studio workflow](.github/workflows/deploy-studio.yml) uses the `SANITY_AUTH_TOKEN` GitHub secret to deploy Sanity Studio. `SANITY_PROJECT_ID` and `SANITY_APP_ID` are optional GitHub variable overrides.

## Configure Worker runtime secrets

Set runtime secrets under **Settings → Variables & Secrets** on each Worker. Use separate Neon connections, Sanity tokens, and signing keys for staging and production. The [environment template](.env.example) lists feature-specific credentials. Keep `DATABASE_DIRECT_URL` with the migration tooling. [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

Production runs the article cron configured in Wrangler. For generic webhook delivery, run `pnpm --filter @portfolio/api run start:webhook-relay` on a Node host, put it behind HTTPS, and set `WEBHOOK_RELAY_URL` and a shared `WEBHOOK_RELAY_SECRET` on the Worker. [Notification configuration](apps/api/AGENTS.md#feature-ownership)
