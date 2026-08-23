# Database guidance

This package owns the lazy Neon HTTP Drizzle client, PostgreSQL schema, assistant repositories, and
Drizzle migrations. Consumers must not issue Drizzle queries directly.

## Schema and repository invariants

- Define tables under `src/db/schema` and re-export them through `src/db/schema.ts` and
  `src/index.ts`.
- `src/db/schema/ai.ts` owns knowledge documents/chunks, ingestion runs, anonymous chat
  sessions/messages, and retrieval events. `src/db/schema/user.ts` is an existing user-table
  scaffold with no application repository or current consumer; do not imply it backs authentication.
- Keep Drizzle operators, SQL fragments, batches, and transactions inside this package. Apps consume
  repository functions exported from `src/index.ts`, not `db`, schema tables, or `drizzle-orm`.
- Preserve lazy database initialization so imports and builds do not connect eagerly.
- Read `DATABASE_URL` and optional `DATABASE_DIRECT_URL` from `@portfolio/env/database`.
  Application queries use the pooled/application URL; Drizzle CLI prefers the direct URL when supplied.
- Preserve the generated English `tsvector`, GIN full-text index, 2,048-dimension vector column, and
  cosine HNSW expression index over `halfvec(2048)`. An embedding-dimension change requires
  coordinated API constants, schema, migration, index, and forced reindex updates.
- Preserve foreign-key deletion behavior, message-provider idempotency, the unique ingestion lock, and
  deterministic document/chunk replacement semantics.

## Migration workflow

- Run `pnpm db:generate` after schema changes and inspect the generated SQL and snapshot.
- Do not hand-edit generated snapshots. Edit migration SQL only when the migration was intentionally
  generated as a Drizzle custom migration for unsupported operations such as extensions or expression
  indexes.
- Run `pnpm db:check` to validate migration consistency.
- Do not run `db:migrate`, `db:push`, `db:pull`, `db:export`, `db:up`, or
  `db:studio` without explicit authorization and a confirmed database target. Generating or checking
  does not authorize applying.
- The GitHub migration workflow applies checked migrations on database changes to `dev` and `main`
  using the corresponding Preview or Production environment.

## Verification

- Run `pnpm --filter @portfolio/database check-types` after TypeScript or schema changes.
- Run `pnpm db:check` after migration changes.
- Run the root type check after changing exported schema or repository contracts.
- Database scripts load the repository-root `.env.local`; never print either connection URL.
