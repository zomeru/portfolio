# Database guidance

This package provides the shared Drizzle ORM PostgreSQL client and schema. It exports both from `src/index.ts` and initializes the connection lazily from `DATABASE_URL`.

- Define tables under `src/db/schema` and re-export them through `src/db/schema.ts`.
- Never edit files under `drizzle` by hand. After schema changes, run `pnpm db:generate`, review the generated migration, and use `pnpm db:migrate` to apply it.
- Keep database access environment-driven through `@portfolio/env`; do not embed connection details.
- Run `pnpm --filter @portfolio/database check-types` after changes. Database commands read the root `.env.local`.
- Update this file when the exported schema/client contract or migration workflow changes.
