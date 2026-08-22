# Studio guidance

This workspace owns Sanity Studio, the content model, desk structure, seed data, and web type generation.

## Studio invariants

- Define schemas under `schemaTypes` and register each type in `schemaTypes/index.ts`.
- Keep `structure` aligned with the registered document types.
- Preserve the singleton `profile` behavior configured in `sanity.config.ts`.
- Keep project, dataset, and app configuration in `@portfolio/env/sanity`.
- Keep shared blog field limits aligned through `@portfolio/content/blog`.
- Keep seed fixtures in `data` and compatible with their schemas.
- Preserve the read-only `blogPost.generation` metadata used by the API for auditability and idempotency.
- Do not edit `schema.json` or `apps/web/src/lib/sanity/sanity.types.ts` by hand.

## Type generation

- Run `pnpm --filter @portfolio/studio typegen` after schema or GROQ query changes. Schema extraction uses
  the development workspace because both Studio workspaces share the same schema.
- Review changes to both `schema.json` and `apps/web/src/lib/sanity/sanity.types.ts`.

## External writes

- The seed script may write only to the `development` dataset.
- Run `pnpm --filter @portfolio/studio seed --dry-run` before an authorized seed.
- Do not run a non-dry seed without explicit authorization.
- Confirm the Sanity project and dataset before deploying Studio or GraphQL changes.

## Studio verification

- Run `pnpm --filter @portfolio/studio check-types` after code or schema changes.
- Run `pnpm --filter @portfolio/studio build` after configuration or dependency changes.
