# Environment package guidance

This package owns Zod validation and normalized return contracts for runtime-scoped configuration. It
is a source-exported internal package; consumers import explicit subpaths.

## Export contracts

- `./admin`: `ADMIN_ACCESS_KEY` with a minimum length of 32 for the page-wide admin gate.
- `./site`: `NODE_ENV` and `NEXT_PUBLIC_SITE_URL`; the Portless `.localhost` fallback is
  development-only
  and the URL is required in production.
- `./sanity`: public project, selected development/production dataset, app ID, and dataset map.
- `./sanity-server`: required server-only `SANITY_API_TOKEN`.
- `./sanity-revalidate-server`: signed Sanity webhook secret with a minimum length of 32.
- `./github-server`: required server-only `GH_PAT_TOKEN`.
- `./ai-server`: required Google API key and Gemini model identifier for blog generation.
- `./assistant-server`: Ask Zomer provider keys, selected chat provider and model IDs, the OpenRouter
  embedding model ID, and the AI-index capability secret.
- `./cron`: `CRON_SECRET` with a minimum length of 32.
- `./database`: required `DATABASE_URL` and optional `DATABASE_DIRECT_URL`.
- `./langfuse-server`: optional public/secret key pair and defaultable base URL; one key without the
  other is invalid.
- `./notifications-server`: grouped optional Gmail/Resend, Web Push, notification-token, and webhook
  encryption configuration; incomplete feature groups are invalid and the accessor returns normalized
  camel-case properties.

## Invariants

- Group validation by consumer and runtime boundary. Importing one subpath must not validate unrelated
  feature variables.
- Parse every schema through `parseEnv` so errors keep the shared field-oriented format.
- Return small normalized consumer contracts from accessors instead of leaking raw environment names;
  schema validation errors should still use the original variable names.
- Never expose server-only values through `NEXT_PUBLIC_*`, browser modules, logs, errors, or
  generated client code.
- Keep `package.json` exports synchronized with `src` modules and preserve the package-private
  `#utils` import mapping used by Node.js, Next.js, and Studio.
- Update all consumers, `.env.example`, `README.md`, `turbo.json`, and relevant workflows when
  a variable name, default, or requirement changes. The direct database variable is
  `DATABASE_DIRECT_URL`.
- Root and workspace commands load `.env.local` through dotenv. Do not add secret defaults to source.

## Verification

- Run `pnpm --filter @portfolio/env check-types` after changes.
- Run each affected consumer's type check and build after changing an exported contract.
- Run the root type check when a change affects more than one consumer.
