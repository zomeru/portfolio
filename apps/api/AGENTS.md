# API guidance

This workspace owns the reusable Hono backend and server-side business logic. The web workspace mounts
the exported app but does not own its routes or services.

## API invariants

- Compose middleware and feature route modules in `src/app.ts`; keep feature routes under `src/routes`
  and non-HTTP business logic under `src/services`.
- Export the Next.js-safe app through the package root and export `AppType` through `./types`. Keep the
  root export marked with `server-only`; browser consumers may import API types only with `import type`.
- Export TypeScript source directly as a just-in-time internal package. Next.js owns compilation and
  bundling; do not add a standalone server entry point or require a separate API build.
- Preserve Hono route chaining so `AppType` and future RPC consumers retain endpoint inference.
- Do not couple the API to web interface code.
- Preserve request IDs, secure headers, structured logging, JSON errors, and graceful shutdown.
- Keep logs free of credentials, authorization headers, and sensitive request bodies.
- Read AI, cron, and Sanity configuration through `@portfolio/env` subpath contracts.
- Read shared blog field and generation limits from `@portfolio/content/blog`; keep prompt wording and
  provider behavior local to the blog-generation service.
- Keep AI provider selection under `src/services/ai` so later assistant features can reuse it without
  coupling to blog generation.
- Keep assistant orchestration, retrieval ranking, ingestion, prompts, and evaluation logic under
  `src/services/assistant`; access PostgreSQL only through repositories exported by `@portfolio/database`.
- Blog generation uses the official `@ai-sdk/google` provider directly. Do not route it through AI
  Gateway or another provider abstraction without an explicit product change.
- Keep Ask Zomer AI ingestion independent from blog generation; publishing a blog must not directly mutate
  the derived PostgreSQL knowledge index.
- Use Hono request and response APIs.

## API verification

- Run `pnpm --filter @portfolio/api check-types` after TypeScript changes.
- Smoke-test the root route and an unknown route through the Next.js adapter after changing routes or
  middleware.
- Confirm request IDs, security headers, status codes, and response formats in smoke tests.
