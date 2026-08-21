# Environment package guidance

This package owns shared Zod validation for server and Sanity configuration.

## Environment invariants

- Group schemas by consumer and runtime boundary.
- The root export contains shared server configuration.
- The `./sanity` export contains public Sanity project, dataset, and app configuration.
- The `./sanity-server` export contains the private Sanity API token contract.
- Parse values through `parseEnv` so validation errors retain the shared format.
- Never expose server-only values through public-prefixed variables or client code.
- Keep `package.json` exports synchronized with modules under `src`.
- Update all consumers when renaming a variable or changing a default.
- Update `README.md`, CI, and deployment workflows when environment requirements change.

## Environment verification

- Run `pnpm --filter @portfolio/env check-types` after package changes.
- Run the affected consumer's type check and build after changing an exported contract.
- Run the root type check when a change affects more than one consumer.
