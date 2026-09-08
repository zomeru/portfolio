import assert from "node:assert/strict";
import test from "node:test";

import {
  BLOG_POST_CACHE_TAG,
  blogPostCacheTag,
  getBlogPostCacheTags,
  getSanityCacheTags,
} from "./cache-tags";

void test("newly published blog invalidates the list and its detail entry", () => {
  assert.deepEqual(getBlogPostCacheTags("fresh-article"), ["blogPost", "blogPost:fresh-article"]);
});

void test("blog invalidation without a slug only expires the list", () => {
  assert.deepEqual(getBlogPostCacheTags(), [BLOG_POST_CACHE_TAG]);
  assert.deepEqual(getBlogPostCacheTags(null), [BLOG_POST_CACHE_TAG]);
});

void test("blog create, update, and delete payloads expire list and detail tags", () => {
  for (const payload of [
    { _type: "blogPost", slug: "fresh-article" },
    { _type: "blogPost", slug: "fresh-article", previousSlug: null },
  ] as const) {
    assert.deepEqual(getSanityCacheTags(payload), ["blogPost", "blogPost:fresh-article"]);
  }
});

void test("blog slug changes expire the previous and current detail entries", () => {
  assert.deepEqual(
    getSanityCacheTags({ _type: "blogPost", slug: "new-slug", previousSlug: "old-slug" }),
    ["blogPost", "blogPost:new-slug", "blogPost:old-slug"],
  );
});

void test("blog invalidation never expires unrelated domains", () => {
  for (const tags of [
    getBlogPostCacheTags("fresh-article"),
    getSanityCacheTags({ _type: "blogPost", slug: "fresh-article", previousSlug: "old-slug" }),
  ]) {
    assert.ok(!tags.some((tag) => tag === "profile" || tag.startsWith("project")));
  }
});

void test("non-slugged types ignore slug fields", () => {
  assert.deepEqual(
    getSanityCacheTags({ _type: "profile", slug: "ignored", previousSlug: "ignored" }),
    ["profile"],
  );
});

void test("slugged portfolio types scope list and detail tags", () => {
  assert.deepEqual(getSanityCacheTags({ _type: "experience", slug: "example-co" }), [
    "experience",
    "experience:example-co",
  ]);
  assert.deepEqual(getSanityCacheTags({ _type: "project", slug: "public-project" }), [
    "project",
    "project:public-project",
  ]);
});

void test("blog detail tags match the published query cache tags", () => {
  assert.equal(blogPostCacheTag("published-article"), "blogPost:published-article");
});
