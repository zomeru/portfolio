# Repository guidance

This file defines repository-wide rules. A nested `AGENTS.md` adds scope-specific rules; the nearest
file wins when instructions differ.

## Workspace boundaries

- `apps/web` is the only deployed Next.js process. It owns UI, App Router files, metadata, machine
  discovery routes, MCP transports, and the thin Hono adapter.
- `apps/api` owns HTTP routes and server-side GitHub, AI, retrieval, indexing, persistence
  orchestration, Sanity publishing logic, and the canonical public portfolio contract. It is a
  source-exported just-in-time package, not a separate service.
- `apps/studio` owns the Sanity schema, Studio workspaces, structure, seed fixtures, and TypeGen
  workflow.
- `packages/database` owns all Drizzle schema, client, query, repository, and migration code.
- `packages/env` owns runtime-scoped environment parsing. Consumers must use its exported subpaths.
- `packages/content` contains only stable cross-workspace content contracts.
- `packages/typescript-config` owns shared compiler presets.

Do not bypass a boundary with cross-workspace relative imports. Use declared `workspace:*`
dependencies and public package exports. Browser code may import API types from
`@portfolio/api/types`; the API root is server-only.

## Repository constraints

- Use Node.js 24.19.x and pnpm 11.24.0. Do not use npm or Yarn for repository tasks.
- Run supported scripts through pnpm. Use a filtered workspace script when the root has no alias.
- Keep changes scoped and preserve unrelated working-tree changes.
- Preserve strict TypeScript and the repository Oxfmt rules: two spaces, double quotes, semicolons, and
  a 100-column width.
- Keep package task logic in its owning workspace and let root scripts delegate through `turbo run`.
- Treat `apps/studio/schema.json`, `apps/web/src/lib/sanity/sanity.types.ts`, Drizzle snapshots,
  and build output as generated. Use the owning generator instead of editing them.
- Never print, expose, or commit `.env.local` or other secret values.
- Do not deploy, seed content, publish, or mutate a database without explicit authorization. Confirm
  the project, dataset, database, GitHub environment, or deployment target before an external write.

## Architecture invariants

- Sanity is authoritative for published portfolio content. PostgreSQL holds the derived AI index, chat
  persistence, retrieval events, and ingestion state; do not turn it into a second content source.
- The web app mounts `@portfolio/api` at `src/app/api/[[...route]]/route.ts`. Keep the adapter thin
  and the Hono app on its `/api` base path.
- Server-side web callers use the in-process Hono client in
  `apps/web/src/lib/api-server.ts`; browser callers use the typed HTTP client in
  `apps/web/src/lib/api.ts`.
- `apps/api/src/services/public-portfolio` owns the canonical published GROQ queries and validates
  their results at runtime. Studio TypeGen scans the web workspace and generates the web Sanity types;
  it does not validate API queries. Regenerate both Studio artifacts after schema changes.
- Portfolio intents in Ask Zomer stay grounded in the derived index. General intent may use native web
  search only when the selected provider supports it; keep web citations distinct from indexed
  portfolio sources.
- Ask Zomer embeddings are fixed at 2,048 dimensions. A model dimension change requires a schema
  migration, HNSW review, and forced reindex.
- Generated blog publication performs a best-effort single-document AI index update. Keep publication
  success distinct from indexing success.
- Every successful generated-blog publication enters the durable notification event pipeline after
  Sanity succeeds. Email, push, and webhook failures must remain distinct from publication success.
- Optional Langfuse configuration exports AI and custom spans. Any call with recorded inputs or outputs
  may send prompts, retrieved content, and responses to the configured Langfuse project.

## Verification

Choose checks by affected scope:

- Run the affected workspace's `check-types` after TypeScript changes.
- Run the affected workspace's build after routing, bundling, runtime, schema, or configuration changes.
- Run `pnpm lint` after code or configuration changes.
- Run `pnpm boundaries` after workspace dependency or package-export changes. CI enforces Turbo's
  undeclared-dependency and cross-package file-import checks.
- Keep automated tests minimal. Add them only for complex logic, security boundaries, or stable public
  contracts where type checking and direct verification are insufficient.
- Do not add tests for routine portfolio UI, presentation, source-code patterns, logging wrappers, or
  straightforward framework wiring.
- Run `pnpm test` after changing tested API contracts, cryptography, SSRF protection, authentication,
  durable delivery behavior, or similarly high-risk server logic.
- Run `pnpm run check:all` and `pnpm run build:all` after shared package or dependency changes.
- Run `pnpm ai:eval` after deterministic assistant intent or retrieval-strategy changes; use
  `--live` only with an authorized, migrated, indexed environment.
- Run the full production pipeline for production-readiness or security work:

```sh
pnpm run check:all:build && pnpm run security:check && pnpm run security:audit
```

Keep `.github/workflows/ci.yml`, `README.md`, and the workspace test scripts aligned with the
production pipeline.

## Instruction maintenance

Update an `AGENTS.md` only for a durable ownership boundary, invariant, command, or workflow. Keep
feature explanation in `README.md` or product documentation and avoid repeating root rules in nested
files.
