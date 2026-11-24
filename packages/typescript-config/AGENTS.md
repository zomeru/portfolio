# TypeScript configuration guidance

This package owns the two shared compiler presets: `base.json` for API, Studio, content, database,
and env, and `web.json` for web.

## Preset invariants

- Put repository-wide language and safety defaults in `base.json`: strict mode, exact optional
  properties, unchecked index/import safeguards, isolated modules, ES2022, Bundler resolution,
  and no-emit behavior.
- Keep the React JSX default in `web.json`.
- Consumer configs may override module resolution for their bundler. Do not weaken a shared check to
  hide an error in one workspace.
- Enable declaration generation in a package's build configuration if that package emits
  declarations. Source-exported workspaces only type-check.

## Verification

- Run `pnpm check-types` after preset changes and review errors in every consumer.
- Run `pnpm build:all` after changing target, modules, resolution, libraries, JSX, declarations, or
  browser and Worker type checking.
