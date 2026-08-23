# Content package guidance

This source-exported package owns stable content contracts shared by multiple workspaces. It is
currently limited to `BLOG_CONTENT_LIMITS` through the `./blog` export.

## Invariants

- Add a value only when more than one workspace must enforce the same persisted field or content rule.
- Keep UI layout, cache durations, API versions, prompts, provider options, and feature-local behavior
  in the owning app.
- Keep exports dependency-free and safe for API, web, and Studio consumers.
- Blog limits coordinate the Studio schema and API structured-output validation. Update all consumers
  and existing fixture assumptions together when changing them.
- Add explicit domain subpath exports in `package.json`; do not introduce a catch-all barrel.

## Verification

- Run `pnpm --filter @portfolio/content check-types` after package changes.
- Run the API and Studio type checks after changing `BLOG_CONTENT_LIMITS`.
- Run each affected consumer build when a shared contract changes runtime validation or generated schema.
