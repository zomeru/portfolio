# TypeScript configuration guidance

This package owns shared compiler presets. `base.json` is used by API, Studio, content, database, and
env; `nextjs.json` is used by web. `react-library.json` is available but has no current consumer.

## Preset invariants

- Put repository-wide language and safety defaults in `base.json`: strict mode, exact optional
  properties, unchecked index/import safeguards, isolated modules, ES2022, and NodeNext defaults.
- Keep Next.js-specific Bundler resolution, JSX preservation, plugin configuration, and no-emit
  behavior in `nextjs.json`.
- Keep React-library JSX behavior in `react-library.json`; do not add Next.js assumptions there.
- Consumer configs may override module resolution for their bundler. Do not weaken a shared check to
  hide an error in one workspace.
- Preserve declaration defaults in the base preset even though source-exported consumers commonly set
  `noEmit`; future compiled packages rely on the base contract.
- Keep the `next` devDependency synchronized with the web workspace because the shared Next.js
  preset references the Next plugin contract.

## Verification

- Run `pnpm check-types` after preset changes and review errors in every consumer.
- Run `pnpm build:all` after changing target, modules, resolution, libraries, JSX, declarations, or
  the Next.js plugin configuration.
