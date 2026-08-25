import assert from "node:assert/strict";
import test from "node:test";
import { createTestPublicPortfolioService } from "@portfolio/api/public-portfolio/testing";
import { GET as getRobots } from "@/app/robots.txt/route";
import { GET as getSchemaMap } from "@/app/schemamap.xml/route";
import { getSitemapEntries } from "@/app/sitemap";
import { siteUpdatedAt } from "@/lib/metadata";
import { getSchemaFeedRecords, serializeSchemaFeed } from "@/lib/schema-feed";

const expectedCrawlers = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Google-Extended",
  "DeepSeekBot",
  "Applebot-Extended",
  "PerplexityBot",
  "ora-agent",
];

test("robots advertises AI crawler access, the sitemap, and the schema map", async () => {
  const response = getRobots();
  const text = await response.text();

  assert.match(response.headers.get("content-type") ?? "", /text\/plain/);
  for (const crawler of expectedCrawlers) {
    assert.match(text, new RegExp(`User-agent: ${crawler}\\nAllow: /`));
  }
  assert.match(text, /Disallow: \/admin/);
  assert.match(text, /Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/);
  assert.match(text, /schemamap: https?:\/\/[^\s]+\/schemamap\.xml/);
});

test("sitemap includes freshness and priority metadata for pages and blogs", async () => {
  const snapshot = await createTestPublicPortfolioService().getSnapshot();
  const entries = getSitemapEntries(snapshot.blogs, "https://portfolio.example/");
  const home = entries.find(({ url }) => url === "https://portfolio.example/");
  const blog = entries.find(
    ({ url }) => url === "https://portfolio.example/blogs/published-article",
  );

  assert.deepEqual(home, {
    changeFrequency: "monthly",
    lastModified: siteUpdatedAt,
    priority: 1,
    url: "https://portfolio.example/",
  });
  assert.deepEqual(blog, {
    changeFrequency: "yearly",
    lastModified: new Date("2026-08-01T00:00:00.000Z"),
    priority: 0.7,
    url: "https://portfolio.example/blogs/published-article",
  });
  assert.ok(entries.every(({ priority }) => priority !== undefined));
});

test("schema map points to a valid public schema.org JSON Lines feed", async () => {
  const snapshot = await createTestPublicPortfolioService().getSnapshot();
  const records = getSchemaFeedRecords(
    snapshot,
    new URL("https://portfolio.example/"),
    siteUpdatedAt,
  );
  const serialized = serializeSchemaFeed(records);
  const parsed = serialized
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));

  assert.deepEqual(
    parsed.map((record) => record["@type"]),
    ["Person", "WebSite", "ProfilePage", "CreativeWork", "Article"],
  );
  assert.doesNotMatch(serialized, /secret|internalId|_rev|drafts\./i);

  const schemaMap = getSchemaMap();
  const xml = await schemaMap.text();
  assert.match(schemaMap.headers.get("content-type") ?? "", /application\/xml/);
  assert.match(xml, /<loc>https?:\/\/[^<]+\/structured-data\/portfolio\.jsonl<\/loc>/);
  assert.match(xml, /<sf:contentType>structuredData\/schema\.org<\/sf:contentType>/);
  assert.match(xml, new RegExp(`<lastmod>${siteUpdatedAt.toISOString()}</lastmod>`));
});
