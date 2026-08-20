# Studio guidance

This workspace owns the Sanity Studio, portfolio content model, desk structure, seed data, and Sanity type generation for `apps/web`.

- Define document/object schemas under `schemaTypes` and register new types in `schemaTypes/index.ts`; keep the custom desk structure in `structure` aligned.
- Preserve the singleton `profile` document behavior configured in `sanity.config.ts`.
- `config.ts`, the CLI, and Studio all use `@portfolio/env/sanity`. Dataset/project/app changes belong in the shared environment contract.
- Seed fixtures live in `data`; `scripts/seed.ts` may write only to `development` and requires `SANITY_API_TOKEN`. Keep seed identities and schemas compatible.
- Run `pnpm --filter @portfolio/studio check-types` for code/schema changes. Run `typegen` after query-relevant schema changes; it updates `schema.json` and `apps/web/src/lib/sanity/sanity.types.ts`.
- Update this file when Studio behavior, schema workflow, seeding, type generation, or deployment conventions change.
