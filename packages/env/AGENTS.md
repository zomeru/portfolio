# Environment package guidance

This package centralizes Zod validation for database and Sanity configuration.

- Keep environment schemas grouped by consumer: the root export covers general server values, `./sanity` covers project/dataset/app configuration, and `./sanity-server` covers the private API token.
- Parse through `parseEnv` so validation errors retain the shared format. Never expose server-only secrets through public-prefixed variables or client code.
- Keep `package.json` exports synchronized when adding an environment module; update all consumers when renaming a variable or changing a default.
- Run `pnpm --filter @portfolio/env check-types` after changes.
- Update this file when the environment contract, exports, defaults, or validation workflow changes.
