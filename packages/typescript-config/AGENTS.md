# TypeScript configuration guidance

This package owns shared strict TypeScript presets: `base.json` for general ESM code, `nextjs.json` for Next.js applications, and `react-library.json` for React libraries.

- Put repository-wide compiler defaults in `base.json`; keep framework-specific overrides in the matching preset.
- Preserve strict checking, NodeNext-compatible base resolution, and declaration output unless every consumer is intentionally migrated.
- Validate changes with `pnpm check-types` from the repository root because this package has no standalone check script.
- Update this file when preset responsibilities, compiler conventions, or validation workflow changes.
