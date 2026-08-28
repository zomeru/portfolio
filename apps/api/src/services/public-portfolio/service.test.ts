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
  assert.equal(serialized.experience[0]?.canonicalUrl, "https://portfolio.example/work/example-co");
  assert.equal(
    serialized.projects[0]?.canonicalUrl,
    "https://portfolio.example/projects/public-project",
  );
  assert.deepEqual(serialized.experience[0]?.details, [
    {
      content: [{ style: "bullet", text: "Improved the API." }],
      title: "Technical work",
    },
  ]);
  assert.equal(
    serialized.blogs[0]?.canonicalUrl,
    "https://portfolio.example/blogs/published-article",
  );
  assert.doesNotMatch(json, /secret|internalScore|internalId|_id/);

  const legacySnapshot = serializePublicSnapshot(
    {
      ...rawPublicSnapshotFixture,
      experience: [{ ...rawPublicSnapshotFixture.experience[0], slug: null }],
      projects: [{ ...rawPublicSnapshotFixture.projects[0], slug: "Invalid project slug" }],
    },
    testSiteUrl,
  );
  assert.equal(legacySnapshot.experience[0]?.slug, "example-co");
  assert.equal(legacySnapshot.projects[0]?.slug, "public-project");

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
  assert.equal((await service.getExperience("example-co"))?.company, "Example Co");
  assert.equal((await service.getProject("public-project"))?.title, "Public Project");
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

void test("resume fetches only the profile, experience, and tech-stack domains", async () => {
  const calls: string[] = [];
  const service = createPublicPortfolioService({
    async fetchBlogPost() {
      return rawPublicBlogPostFixture;
    },
    async fetchBlogPosts() {
      calls.push("blogs");
      return rawPublicSnapshotFixture.blogs;
    },
    async fetchExperienceList() {
      calls.push("experience");
      return rawPublicSnapshotFixture.experience;
    },
    async fetchProfile() {
      calls.push("profile");
      return rawPublicSnapshotFixture.profile;
    },
    async fetchProjectList() {
      calls.push("projects");
      return rawPublicSnapshotFixture.projects;
    },
    async fetchTechStack() {
      calls.push("techStack");
      return rawPublicSnapshotFixture.techStack;
    },
    siteUrl: testSiteUrl,
  });

  const resume = await service.getResume();

  assert.equal(resume?.name, rawPublicSnapshotFixture.profile?.name);
  assert.deepEqual(calls.sort(), ["experience", "profile", "techStack"]);
});
