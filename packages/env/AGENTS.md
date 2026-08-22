# Environment package guidance

This package owns shared Zod validation for runtime-specific configuration.

## Environment invariants

- Group schemas by consumer and runtime boundary; do not make one consumer validate another
  workspace's variables.
- The `./sanity` export contains public Sanity project, dataset, and app configuration.
- The `./sanity-server` export contains the private Sanity API token contract.
- The `./ai-server` export contains server-only Google Generative AI key and model configuration.
- The `./cron` export contains the Vercel Cron authentication contract.
- The `./database` export contains database connection configuration.
- The `./site` export contains the deployment origin and runtime mode.
- Parse values through `parseEnv` so validation errors retain the shared format.
- Never expose server-only values through public-prefixed variables or client code.
- Keep `package.json` exports synchronized with modules under `src`.
- Preserve the package-private `#utils` import mapping. It allows the TypeScript source package to run
  in Node.js 24 while remaining consumable by Next.js and Studio.
- Update all consumers when renaming a variable or changing a default.
- Update `README.md`, CI, and deployment workflows when environment requirements change.

## Environment verification

- Run `pnpm --filter @portfolio/env check-types` after package changes.
- Run the affected consumer's type check and build after changing an exported contract.
- Run the root type check when a change affects more than one consumer.
