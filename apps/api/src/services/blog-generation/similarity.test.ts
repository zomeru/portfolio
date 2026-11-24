import assert from "node:assert/strict";
import test from "node:test";

import { sharesTitleOrOutline } from "./similarity";

const article = {
  title: "Index PostgreSQL webhooks without blocking writes",
  slug: "index-postgresql-webhooks",
  excerpt:
    "Measure how long an index build holds locks and verify whether deliveries can continue.",
  tags: ["PostgreSQL", "webhooks"],
  body: `## Inspect locks during the migration

## Build the index concurrently

## Verify that webhook deliveries still succeed`,
};

void test("detects repeated slugs, normalized titles, and substantially reused outlines", () => {
  assert.equal(sharesTitleOrOutline(article, { ...article, title: "A different title" }), true);
  assert.equal(
    sharesTitleOrOutline(article, {
      ...article,
      slug: "a-different-slug",
      title: "Index PostgreSQL Webhooks Without Blocking Writes!",
    }),
    true,
  );
  assert.equal(
    sharesTitleOrOutline(article, {
      ...article,
      slug: "a-different-slug",
      title: "A different title",
      excerpt: "A different description.",
    }),
    true,
  );
});

void test("allows a different article in the same domain", () => {
  assert.equal(
    sharesTitleOrOutline(article, {
      ...article,
      title: "Retry webhook deliveries with an outbox",
      slug: "retry-webhooks-with-an-outbox",
      excerpt: "Use an outbox row to recover when the provider response is delayed.",
      body: "## Record the delivery attempt\n\n## Recover after the provider times out",
    }),
    false,
  );
});
