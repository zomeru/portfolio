# Content package guidance

This package owns stable, cross-workspace content contracts. It must remain runtime-agnostic and export
TypeScript source directly as a just-in-time internal package.

## Content invariants

- Add a value only when multiple workspaces share the same content rule or persisted field contract.
- Keep UI layout values, cache durations, provider prompts, API versions, and feature-local implementation
  details with their owning workspace.
- Group exports by content domain through explicit subpaths such as `./blog`.
- Keep exports dependency-free and safe for server, browser, and Studio consumers.
- Update every consumer when changing a shared contract.

## Content verification

- Run `pnpm --filter @portfolio/content check-types` after package changes.
- Run each affected consumer's type check and build after changing an exported contract.
