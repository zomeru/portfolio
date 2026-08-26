import assert from "node:assert/strict";
import test from "node:test";

import { createPublicPortfolioService, serializePublicSnapshot } from "./service";
import { rawPublicBlogPostFixture, rawPublicSnapshotFixture, testSiteUrl } from "./test-fixtures";

void test("public serializers allowlist fields and produce canonical URLs", async () => {
  const serialized = serializePublicSnapshot(rawPublicSnapshotFixture, testSiteUrl);
  const json = JSON.stringify(serialized);

  assert.equal(
    serialized.profile?.resumePdfUrl,
    "https://portfolio.example/assets/GREGORIO_ZOMER_RESUME.pdf",
  );
  assert.equal(serialized.projects[0]?.canonicalUrl, "https://portfolio.example/projects");
  assert.equal(
    serialized.blogs[0]?.canonicalUrl,
    "https://portfolio.example/blogs/published-article",
  );
  assert.doesNotMatch(json, /secret|internalScore|internalId|_id/);

  const service = createPublicPortfolioService({
    async fetchBlogPost() {
      return rawPublicBlogPostFixture;
    },
    async fetchSnapshot() {
      return rawPublicSnapshotFixture;
    },
    siteUrl: testSiteUrl,
  });
  const post = await service.getBlogPost("published-article");
  assert.equal(post?.body, "## Article body");
  assert.doesNotMatch(JSON.stringify(post), /internalId/);
});

void test("blog listing searches titles case-insensitively before pagination", async () => {
  const service = createPublicPortfolioService({
    async fetchBlogPost() {
      return rawPublicBlogPostFixture;
    },
    async fetchSnapshot() {
      return {
        ...rawPublicSnapshotFixture,
        blogs: [
          {
            ...rawPublicSnapshotFixture.blogs[0],
            slug: "unrelated-article",
            title: "Unrelated Article",
          },
          rawPublicSnapshotFixture.blogs[0],
        ],
      };
    },
    siteUrl: testSiteUrl,
  });

  const result = await service.listBlogPosts({ limit: 1, query: "  PUBLISHED  " });

  assert.equal(result.total, 1);
  assert.equal(result.items[0]?.title, "Published Article");
});
