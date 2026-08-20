# API guidance

This workspace is a small Hono server for Node.js. Its entry point is `src/index.ts`; it currently exposes only `GET /` and listens on port 3000.

- Keep routes and server wiring within this workspace; do not couple the API to web UI code.
- Use Hono request/response APIs and preserve the ESM Node build emitted to `dist`.
- Run `pnpm --filter @portfolio/api check-types` after changes. Use `dev:watch` for local development and `build` before validating `start`.
- Update this file when API responsibilities, routing structure, runtime, or commands change.
