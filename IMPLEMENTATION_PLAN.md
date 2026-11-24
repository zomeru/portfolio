# Portfolio modernization plan

## 1. Baseline and compatibility

- [x] Confirm the clean `main` checkout, configured Git identity, pinned toolchain, and local PostgreSQL target.
- [x] Map workspace ownership, publication and retrieval flows, migration history, and deployment paths.
- [x] Record baseline checks and inventory 81 direct packages, peer constraints, overrides, and release documentation for the upgraded stack.
- [ ] Update compatible releases and catalogs, adapt changed APIs, and verify the frozen lockfile.
- [x] Review TypeScript 7.1 options against Node, Vite, and the Workers runtime.

## 2. Embeddings and local PostgreSQL

- [x] Verify the new model's identity and 4,096-dimensional output. Compare pgvector indexing options.
- [x] Add a separate index for the new model so the current Worker can serve during backfill and rollback.
- [x] Reuse content hashes to resume after a failed backfill. Preserve atomic replacement of each document.
- [x] Confirm fresh and existing local migrations, then verify model isolation and cosine search against pgvector.
- [x] Document deployment sequencing, verification, and rollback.

## 3. Blog generation

- [x] Compare Gemini 4 tiers and identify why different generation keys can publish nearly identical posts.
- [x] Upgrade the Google model and make prompts use existing titles, topics, and outlines.
- [x] Add exact and semantic comparisons, bounded retries, and database-backed cross-Worker coordination.
- [x] Verify duplicate comparison and lease acquisition with controlled fixtures. Audit the production corpus read-only.
- [x] Document editorial resolution for existing duplicates.

## 4. Application, security, and deployment audit

- [ ] Audit React, TanStack Start, and Worker request paths, bundles, caching, and accessibility.
- [ ] Review API trust boundaries, abuse controls, observability, SQL patterns, and Cloudflare configuration.
- [ ] Implement and verify concrete fixes that preserve public behavior and visual identity.

## 5. Validation and handoff

- [ ] Run repository checks, builds, dependency audits, Worker dry-runs, and local HTTP smoke tests.
- [ ] Exercise embeddings, retrieval, and duplicate prevention. Record checked scenarios and blockers.
- [x] Update repository guidance and deployment documentation.
- [ ] Commit verified groups locally on `main` under Zomer Gregorio's configured identity.

## Production blog audit

On November 24, 2026 the public Sanity dataset contained 168 published documents at 164 distinct
slugs. Three slug groups shared one public URL each. Normalized-title comparison found 17 pairs.
I also ranked all 14,028 document pairs using cosine similarity on TF-IDF word and bigram
features from published titles, excerpts, and article prose. Scores are screening signals for
editorial review.

| Group                                           | Evidence                                                                                                                                                                      | Review                                                                                |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| TypeScript brand types                          | Three documents at `typescript-how-to-implement-brand-types-for-compile-time-safety` and two at `typescript-how-to-implement-branded-types-for-compile-time-safety`           | Compare all five drafts and consolidate into the strongest practical example.         |
| End-to-end type safety                          | Two published documents at `typescript-how-to-structure-end-to-end-type-safety-across-monorepos`                                                                              | Compare both documents in Sanity and select the one to keep at the existing URL.      |
| Hybrid RAG and reciprocal rank fusion           | `optimizing-rag-hybrid-search-rrf-2026` and its `-1` variant scored 0.923 for title and excerpt                                                                               | Merge only independently valuable examples and redirect the alternate slug.           |
| Next.js partial prerendering for e-commerce     | `optimizing-nextjs-15-partial-prerendering-ecommerce-2` and `-3` had identical normalized title-and-excerpt features. The related base and numbered slugs also ranked highly. | Review the cluster together and verify current framework claims before consolidating. |
| React Native Expo Fingerprint and static Hermes | `optimizing-react-native-expo-fingerprint-static-hermes` and its `-1` variant scored 0.841 for title and excerpt                                                              | Retain any distinct benchmark methodology or setup details after verification.        |

The public list, feeds, and search index now return one entry per slug. The detail query uses
the same published date and document ID tie-breaker. All production documents were read-only.

## Compatibility references

- TypeScript 7.1 adds a stable ES2026 target and library. The API uses ES2025 because the
  current type-aware lint compiler cannot parse ES2026. The browser preset remains at ES2022.
  [TypeScript 7.1 Beta release notes](https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/)
- Drizzle 1.0 RC6 changes snapshot format and adds a bundled PostgreSQL driver with atomic batching.
  The current migrations already use the Drizzle 1.x format.
  [Drizzle RC6 release](https://github.com/drizzle-team/drizzle-orm/releases/tag/v1.0.0-rc.6)
- Gemini 4 Hydrogen is the lowest-priced general-purpose Gemini 4 tier in Google's comparison.
  The Google AI Studio API provides structured output and low reasoning for it.
  [Gemini model comparison](https://aistudio.google.com/docs/choosing-a-model)
  [Google AI SDK provider](https://ai-sdk.dev/providers/ai-sdk-providers/google)
- The new model returns 4,096 dimensions through OpenRouter. Exact cosine search preserves vector
  precision and avoids pgvector's 4,000-dimension HNSW limit for half precision.
  [NVIDIA model card](https://build.nvidia.com/nvidia/nemotron-3_5-embed-8b/modelcard)
  [pgvector index limits](https://github.com/pgvector/pgvector#hnsw)
- The Worker ships the TanStack Start server entry, uses separate rate-limit namespaces, and
  keeps static assets and dynamic content in their existing delivery paths.
  [TanStack Start on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)
  [Cloudflare rate-limit bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- The dependency review consulted publisher documentation and release notes for the 81 original
  direct packages. A scratch resolution without the three pnpm overrides returned nine advisories
  affecting `js-yaml`, `smol-toml`, and `minimatch`. Both audits passed with the overrides.
