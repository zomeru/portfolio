import assert from "node:assert/strict";
import test from "node:test";

import {
  publicApiIndexSchema,
  publicBlogPostListSchema,
  publicBlogPostSchema,
  publicErrorSchema,
  publicExperienceListSchema,
  publicProfileSchema,
  publicProjectListSchema,
  publicResumeSchema,
  publicTechStackSchema,
} from "../services/public-portfolio/schemas";
import {
  createTestPublicPortfolioService,
  testSiteUrl,
} from "../services/public-portfolio/test-fixtures";
import { createPublicApiRoutes } from "./public";

const routes = createPublicApiRoutes({
  service: createTestPublicPortfolioService(),
  siteUrl: testSiteUrl,
});

void test("public REST routes return JSON, CORS, caching, and expected resources", async () => {
  const resources = [
    ["/", publicApiIndexSchema],
    ["/profile", publicProfileSchema],
    ["/resume", publicResumeSchema],
    ["/experience", publicExperienceListSchema],
    ["/projects", publicProjectListSchema],
    ["/blogs", publicBlogPostListSchema],
    ["/blogs/published-article", publicBlogPostSchema],
    ["/tech-stack", publicTechStackSchema],
  ] as const;

  for (const [path, schema] of resources) {
    const response = await routes.request(path, { headers: { Origin: "https://agent.example" } });
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get("access-control-allow-origin"), "*", path);
    assert.match(response.headers.get("cache-control") ?? "", /s-maxage=300/, path);
    assert.match(response.headers.get("content-type") ?? "", /application\/json/, path);
    const body = await response.json();
    schema.parse(body);
    assert.doesNotMatch(JSON.stringify(body), /secret|internalScore|internalId|_rev|drafts\./);
  }

  const index = publicApiIndexSchema.parse(await (await routes.request("/")).json());
  assert.equal(
    index.discovery.docsMcpServerCard,
    "https://portfolio.example/.well-known/mcp/docs-server-card.json",
  );
});

void test("public REST routes validate pagination and return actionable JSON 404s", async () => {
  const invalid = await routes.request("/blogs?limit=51");
  assert.equal(invalid.status, 400);
  assert.equal(publicErrorSchema.parse(await invalid.json()).error.code, "INVALID_QUERY");

  const unknownQuery = await routes.request("/blogs?sort=title");
  assert.equal(unknownQuery.status, 400);
  assert.equal(publicErrorSchema.parse(await unknownQuery.json()).error.code, "INVALID_QUERY");

  const missingPost = await routes.request("/blogs/missing-post");
  assert.equal(missingPost.status, 404);
  assert.equal(publicErrorSchema.parse(await missingPost.json()).error.code, "RESOURCE_NOT_FOUND");

  const missingRoute = await routes.request("/does-not-exist");
  assert.equal(missingRoute.status, 404);
  assert.match(
    publicErrorSchema.parse(await missingRoute.json()).error.resolution,
    /openapi\.json/,
  );
});

void test("public REST routes answer scoped CORS preflight requests", async () => {
  const response = await routes.request("/blogs", {
    headers: {
      "Access-Control-Request-Method": "GET",
      Origin: "https://agent.example",
    },
    method: "OPTIONS",
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.match(response.headers.get("access-control-allow-methods") ?? "", /GET/);
});
