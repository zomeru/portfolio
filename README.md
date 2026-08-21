# Portfolio

Personal portfolio monorepo built with pnpm and Turborepo.

## Workspaces

- `apps/web` — Next.js portfolio backed by published Sanity content.
- `apps/studio` — Sanity Studio, content schemas, seed data, and generated web types.
- `apps/api` — minimal Hono service running on Node.js.
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
SITE_URL=https://zomer.vercel.app
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=development
NEXT_PUBLIC_SANITY_APP_ID=...
SANITY_API_TOKEN=...
```

The site URL and public Sanity values have production/development defaults in `packages/env`. `SANITY_API_TOKEN` is optional for published content in a public dataset and required for private reads and Studio seeding. Studio seeding refuses to write outside the `development` dataset. The API reads `PORT` directly from its runtime environment and defaults to `3000`.

Useful commands:

```sh
pnpm dev                              # web
pnpm --filter @portfolio/studio dev   # Sanity Studio
pnpm --filter @portfolio/api dev:watch
pnpm build                            # web production build
pnpm build:all                        # all buildable workspaces
pnpm check:all                        # lint, dependency, and type checks
pnpm run check:all && pnpm run build:all && pnpm run security:check && pnpm run security:audit
                                      # complete production verification
pnpm studio:seed                      # seed development Sanity content
pnpm db:generate                      # generate a Drizzle migration
pnpm db:migrate                       # apply Drizzle migrations
```

Pull requests and pushes to `dev` or `main` run the complete production verification pipeline in `.github/workflows/ci.yml`. Studio deployments run from `.github/workflows/deploy-studio.yml`: `dev` targets the development GitHub environment and `main` targets production.
