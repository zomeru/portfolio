# Database guidance

This package owns the shared Drizzle ORM PostgreSQL client, schema, and migrations.

## Database invariants

- Define tables under `src/db/schema` and re-export them through `src/db/schema.ts`.
- Keep Drizzle queries, operators, and transactions inside this package. Application workspaces consume
  repository functions rather than importing the client, schema tables, or `drizzle-orm` directly.
- Re-export the public client, schema, and repository contracts through `src/index.ts`.
- Preserve lazy connection initialization unless every consumer is intentionally migrated.
- Read connection details through `@portfolio/env/database`. Never embed or log a connection string.
- Never edit generated migration SQL or snapshots by hand. SQL files created with Drizzle Kit's `--custom`
  workflow are intentionally filled in for extension and expression-index operations.

## Migration workflow

- Run `pnpm db:generate` after schema changes.
- Review generated SQL and metadata before accepting a migration.
- Run `pnpm db:check` to validate migration consistency.
- Do not use `db:migrate`, `db:push`, `db:pull`, or `db:up` without explicit authorization.
- Confirm the target represented by `DATABASE_URL` before any database operation.
- Do not apply a migration merely to verify generated output.

## Database verification

- Run `pnpm --filter @portfolio/database check-types` after TypeScript changes.
- Run the root type check after changing the exported client or schema contract.
- Database scripts read `.env.local` from the repository root.
