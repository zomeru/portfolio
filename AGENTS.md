# Repository guidance

This file defines repository-wide rules. A nested `AGENTS.md` adds workspace-specific rules. When rules conflict, follow the nearest, more-specific file.

## Repository constraints

- Use Node.js 24+ and pnpm 11.22.0. Do not use npm or Yarn for repository tasks.
- Run supported scripts through pnpm. Use a filtered workspace script when the root has no alias.
- Keep changes scoped and preserve unrelated working-tree changes.
- Preserve strict TypeScript and follow the repository Biome configuration.
- Use two spaces, double quotes, semicolons, and a 100-column code width.
- Treat generated artifacts as generated. Run the owning workspace command instead of editing them.
- Never print, expose, or commit values from `.env.local` or other secret sources.
- Do not deploy, seed content, or mutate a database unless the task explicitly requests it.
- Before an external write, confirm the target project, dataset, database, or environment.

## Verification requirements

Choose verification based on the affected scope:

- Run the affected workspace's `check-types` script after TypeScript changes.
- Run the affected workspace's build after routing, bundling, runtime, or configuration changes.
- Run `pnpm lint` after code or configuration changes.
- Run `pnpm run check:all` and `pnpm run build:all` after shared package or dependency changes.
- Run the full production pipeline for production-readiness or security work:

```sh
pnpm run check:all && pnpm run build:all && pnpm run security:check && pnpm run security:audit
```

Keep `.github/workflows/ci.yml` and `README.md` aligned with this production pipeline.

## Instruction maintenance

Update an `AGENTS.md` only when a durable ownership boundary, invariant, command, or workflow changes. Put feature behavior and user-facing instructions in the appropriate product documentation.

Workspace guidance lives in `apps/api`, `apps/studio`, `apps/web`, `packages/database`, `packages/env`, and `packages/typescript-config`.
