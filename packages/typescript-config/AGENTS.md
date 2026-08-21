# TypeScript configuration guidance

This package owns the shared TypeScript presets used across the repository.

## Preset responsibilities

- Put repository-wide compiler defaults in `base.json`.
- Put Next.js-specific overrides in `nextjs.json`.
- Put React library overrides in `react-library.json`.
- Preserve strict checking, exact optional properties, and unchecked import and index safeguards.
- Preserve NodeNext-compatible module resolution and declaration output.
- Do not weaken a shared check to hide a consumer error.

## TypeScript configuration verification

- Run `pnpm check-types` from the repository root after preset changes.
- Run `pnpm build:all` after changing modules, resolution, libraries, targets, or declarations.
- Review every consumer error before changing a shared compiler option.
