# API guidance

This workspace is the reusable Hono backend and all server-side feature orchestration. Next.js
compiles its TypeScript source and mounts `apiApp`; there is no standalone listener or API build.

## Package and routing invariants

- Compose global middleware and chained feature routers in `src/app.ts`. The app owns the `/api`
  base path and mounts `/ai`, `/admin/ai`, `/blog`, `/github`, and the public `/v1` contract.
- Keep HTTP parsing, validation, status mapping, and response shaping under `src/routes`. Put
  non-HTTP behavior under `src/services` and shared security/logging helpers under `src/lib`.
- Preserve route chaining so exported `AppType` retains Hono RPC inference.
- Export the server implementation through `src/next.ts`, public client types through `src/types.ts`,
  and the canonical published portfolio service through `src/public-portfolio.ts`. Keep server
  entrypoints guarded by `server-only`.
- Do not import web components, App Router modules, cookies, or UI state into this workspace.
- Preserve request IDs, Hono secure headers, structured JSON logs, sanitized error responses, and the
  redaction pattern in `src/lib/log.ts`. Never log authorization values, prompts, content, keys,
  tokens, or secrets.

## Feature ownership

- `src/services/public-portfolio` owns published-only Sanity queries, explicit public DTO schemas,
  serialization, OpenAPI generation, and discovery metadata. REST routes and MCP registrations must
  call this service instead of querying Sanity independently. Keep the five-minute cache tags and
  explicit public allowlist; never expose drafts, raw Sanity fields, or RAG/indexing state.

- `src/services/github` owns GitHub GraphQL/REST access and in-memory caches. Only return the public
  response contract: private repository names, commit messages, filter values, and URLs must remain
  anonymized or omitted as implemented.
- `src/services/ai/models.ts` is the provider boundary. Blog generation uses `@ai-sdk/google`
  directly; Ask Zomer chat selects Groq, NVIDIA NIM, or OpenRouter from configuration, while
  embeddings always use OpenRouter. Do not replace one provider path as a side effect of work on the
  other.
- `src/services/blog-generation` owns prompt/output validation, duplicate detection, idempotency,
  immediate Sanity publication, generation audit metadata, and the post-publish index attempt. Indexing
  failure is reported separately and must not roll back a published post.
- `src/services/assistant` owns intent classification, Sanity normalization, section-aware chunking,
  embeddings, hybrid/structured retrieval, prompts, chat persistence, rate limiting, indexing, and
  evaluation support. Keep PostgreSQL calls behind `@portfolio/database` repository exports.
- Full indexing compares deterministic content hashes, skips unchanged documents unless forced,
  removes documents no longer published, refuses stale deletion when Sanity unexpectedly returns zero
  documents, and serializes runs with the ingestion lock. Single-document indexing is used after
  generated publish.
- Retrieval uses deterministic structured chronology, aggregate, and named-term list strategies when
  applicable, otherwise semantic and PostgreSQL full-text candidates with reciprocal-rank fusion. Exact
  structured lists are document operations and do not use the generative context-token budget. Only
  retrieve documents matching the active index version and embedding model. Keep the stored embedding
  dimension and model assertion at 2,048.
- Conversation persistence is anonymous but not stateless: validate the UUID session key, keep message
  IDs idempotent, preserve the bounded history/token window, and enforce both per-minute and per-day
  limits before generation.

## Authentication and telemetry

- Both blog generation methods require the constant-time `CRON_SECRET` bearer check. Manual requests
  may add the validated idempotency header; scheduled keys are date-based.
- Admin capabilities are separate. `blog-generation` tokens are signed with `CRON_SECRET`;
  `ai-reindex` tokens are signed with `AI_INDEX_SECRET_KEY`. Never accept one capability token for
  the other.
- `/admin/ai/*` accepts only the signed reindex bearer token. Do not expose raw capability secrets in
  API responses or client code.
- Deployed AI calls run inside the Next.js Node telemetry registration when Langfuse is enabled;
  standalone CLI and evaluation scripts do not initialize it themselves. Ask Zomer chat and evaluation
  disable raw model input and output recording; blog generation records both. Make recording an explicit
  privacy decision for every new AI call.
- Read configuration only from the appropriate `@portfolio/env` subpath and shared blog limits only
  from `@portfolio/content/blog`.

## Verification

- Run `pnpm --filter @portfolio/api check-types` after TypeScript changes.
- Run `pnpm --filter @portfolio/api test` after public DTO, REST, or OpenAPI contract changes.
- Run `pnpm ai:eval` after intent classification or structured retrieval changes.
- Use `pnpm ai:eval --live` only against an explicitly authorized migrated/indexed database.
- After route or middleware changes, exercise the affected path through the Next.js adapter and verify
  request IDs, security headers, status codes, JSON errors, and streaming behavior where applicable.
- There is no API build script; validate the consuming web build for bundling or runtime-boundary
  changes.
