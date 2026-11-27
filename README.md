# Portfolio

Source for [zomeru.dev](https://zomeru.dev), Zomer Gregorio’s portfolio, technical blog, and Ask Zomer assistant. TanStack Start and Hono run on Cloudflare Workers. Sanity stores published content, and PostgreSQL with pgvector powers semantic search and chat history.

## Run locally

1. Use the Node version in [`.node-version`](.node-version) and the pnpm version in [`package.json`](package.json). Install dependencies and copy the environment template.

   ```sh
   pnpm install --frozen-lockfile
   cp -n .env.example .env.local
   ```

2. Set `SANITY_PROJECT_ID` and `SANITY_API_TOKEN` in `.env.local` for a development Sanity project with published content in the `development` dataset.
3. Run `pnpm dev` and open [the local site](http://localhost:3000). Run `pnpm dev:all` to start Sanity Studio too.

For Ask Zomer, set `DATABASE_URL` to a local PostgreSQL database with pgvector installed. Set `DATABASE_DIRECT_URL` to that same database if you use it. Configure OpenRouter and the key for your selected chat provider, then run `pnpm db:migrate` and `pnpm ai:index`. See [environment settings](.env.example) and [development seed fixtures](apps/studio/AGENTS.md#external-writes-and-verification).

## Checks and deployment

Run `pnpm check:all:build` for lint, types, tests, and builds. GitHub Actions also tests migrations on disposable PostgreSQL, checks both Worker bundles, and audits dependencies. [CI workflow](.github/workflows/ci.yml)

### Workers Free capacity

Static assets and prerendered discovery documents bypass the Worker. Public cache hits skip SSR, but still use one Worker invocation. Check invocation CPU on both cache hits and misses in Workers Logs. Cold SSR, uncached social images, AI requests, blog generation, full reindexing, and bulk delivery may exceed the Free plan's 10 ms CPU budget. Publication and bulk delivery can also exceed 50 external subrequests. The production reindex already runs on the CI runner via `pnpm ai:index:prod`. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)

[Workspace layout and contributor commands](AGENTS.md)
