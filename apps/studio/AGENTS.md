# Studio guidance

This workspace owns the standalone Sanity Studio, content model, structure, seed fixtures, and the
schema and query TypeGen pipeline consumed by the web app.

## Studio and schema invariants

- `sanity.config.ts` exposes production at `/production` and development at `/development` from
  the same project and schema. `sanity.cli.ts` targets the dataset selected by
  `@portfolio/env/sanity`.
- Define schema types under `schemaTypes`, use `defineType`, `defineField`, and
  `defineArrayMember`, and register every type in `schemaTypes/index.ts`.
- Current document types are `profile`, `experience`, `project`, `blogPost`, and
  `techStack`; `richText` and `socialLink` are object types. Keep `structure/index.ts`
  aligned with that registry.
- `profile` is the explicit `profile` singleton. Preserve its structure item and its disabled
  duplicate and delete actions.
- Keep ordinary document IDs Sanity-generated. The profile singleton is the intentional exception.
- Preserve deprecated profile fields with the existing deprecated/read-only/conditional-hidden pattern
  until their stored data is migrated.
- Keep shared blog limits in `@portfolio/content/blog`, and preserve the read-only
  `blogPost.generation` metadata used for provider/model/trigger audit and generation idempotency.
- Tech-stack `order` must remain unique; experience and project order is descending while tech-stack
  order is ascending.

## Content flow and generated files

- The web app and AI index read the published perspective only. Studio drafts are not public or indexed.
- Add or change web-facing GROQ in `apps/web/src/lib/sanity/queries.ts` with `defineQuery`; project
  only the fields consumers use and keep deterministic ordering before slicing.
- `pnpm --filter @portfolio/studio typegen` extracts the development workspace schema to
  `schema.json`, scans web TypeScript for queries, and writes
  `apps/web/src/lib/sanity/sanity.types.ts`.
- Never edit `schema.json` or `apps/web/src/lib/sanity/sanity.types.ts` by hand. Review both
  generated diffs after schema or query changes.
- `data/*.json` contains seed fixtures. `scripts/seed.ts` creates the singleton if absent, creates
  missing experience/blog/project/tech-stack documents by stable content keys, and synchronizes
  matching blog bodies; it is not a general production migration.
- `scripts/label-blog-code-fences.ts` is the owning formatter for Markdown fence labels in
  `data/blog.json`.

## External writes and verification

- Seeding is hard-limited to the development dataset. Run
  `pnpm --filter @portfolio/studio seed --dry-run` before an authorized seed; do not run the write
  mode without explicit approval.
- Confirm project, workspace, dataset, and GitHub environment before Studio or GraphQL deployment.
- Run `pnpm --filter @portfolio/studio check-types` after Studio or schema changes.
- Run `pnpm --filter @portfolio/studio typegen` after schema or web GROQ changes.
- Run `pnpm --filter @portfolio/studio build` after schema, configuration, structure, or dependency
  changes.
