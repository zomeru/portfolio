# Repository guidance

This is a pnpm 11/Turborepo monorepo targeting Node.js 24+. Workspaces live under `apps/*` and `packages/*`.

- Read this file and the nearest app/package `AGENTS.md` before changing a workspace.
- Use workspace scripts through pnpm; use root scripts for cross-workspace checks and database or Studio tasks.
- Keep changes scoped, preserve strict TypeScript, and follow the repository Biome configuration (two spaces, double quotes, semicolons, 100-column width).
- Treat generated artifacts as generated: use the owning workspace command instead of editing them by hand.
- Before handing off, run the narrowest relevant type check/build plus `pnpm lint` when practical.
- If a change alters documented behavior, structure, conventions, or workflows, update the relevant `AGENTS.md` in the same change.

Workspace-specific guidance is in `apps/api`, `apps/studio`, `apps/web`, `packages/database`, `packages/env`, and `packages/typescript-config`.
