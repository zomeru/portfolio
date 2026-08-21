# API guidance

This workspace owns the Hono application and its Node.js server lifecycle.

## API invariants

- Keep Hono routes and middleware in `src/app.ts`.
- Keep port validation, startup, shutdown, and signal handling in `src/index.ts`.
- Do not couple the API to web interface code.
- Preserve request IDs, secure headers, structured logging, JSON errors, and graceful shutdown.
- Keep logs free of credentials, authorization headers, and sensitive request bodies.
- Use Hono request and response APIs.
- Preserve the ECMAScript module build emitted to `dist`.

## API verification

- Run `pnpm --filter @portfolio/api check-types` after TypeScript changes.
- Run `pnpm --filter @portfolio/api build` before validating the production server.
- Smoke-test the root route and an unknown route after changing routes or middleware.
- Confirm request IDs, security headers, status codes, and response formats in smoke tests.
