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
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=development
NEXT_PUBLIC_SANITY_APP_ID=...
SANITY_API_TOKEN=...
```

The public Sanity values have development defaults in `packages/env`; the API token is required by the web app and Studio seed script. Studio seeding refuses to write outside the `development` dataset.

Useful commands:

```sh
pnpm dev                              # web
pnpm --filter @portfolio/studio dev   # Sanity Studio
pnpm --filter @portfolio/api dev:watch
pnpm build                            # web production build
pnpm build:all                        # all buildable workspaces
pnpm check:all                        # lint, dependency, and type checks
pnpm studio:seed                      # seed development Sanity content
pnpm db:generate                      # generate a Drizzle migration
pnpm db:migrate                       # apply Drizzle migrations
```

Studio deployments run from `.github/workflows/deploy-studio.yml`: `dev` targets the development GitHub environment and `main` targets production.
