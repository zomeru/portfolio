import assert from "node:assert/strict";
import test from "node:test";

import { ASSISTANT_EMBEDDING } from "@portfolio/env/embedding";
import { eq } from "drizzle-orm";

import { db } from "../client";
import { knowledgeDocuments } from "../db/schema/ai";
import { blogFingerprints, blogGenerationLocks } from "../db/schema/blog-generation";
import {
  findKeywordKnowledgeCandidates,
  findSemanticKnowledgeCandidates,
  replaceIndexedKnowledgeDocument,
} from "./assistant";
import {
  acquireBlogGenerationLock,
  findSimilarBlogFingerprints,
  refreshBlogGenerationLock,
  releaseBlogGenerationLock,
  writeBlogFingerprints,
} from "./blog-generation";

const testTarget = new URL(process.env.DATABASE_URL ?? "");
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(testTarget.hostname));
assert.match(testTarget.pathname, /^\/portfolio_test_[a-z0-9_]+$/);

const model = ASSISTANT_EMBEDDING.model;
const indexVersion = ASSISTANT_EMBEDDING.indexVersion;
const vector = Array.from({ length: ASSISTANT_EMBEDDING.dimensions }, (_, i) => (i === 0 ? 1 : 0));
const scope = "integration:blog";

void test("serializes generation across connections and matches current blog fingerprints", async (t) => {
  t.after(async () => {
    await db.delete(blogFingerprints).where(eq(blogFingerprints.scope, scope));
    await db.delete(blogGenerationLocks).where(eq(blogGenerationLocks.scope, scope));
  });

  const leases = await Promise.all([
    acquireBlogGenerationLock(scope),
    acquireBlogGenerationLock(scope),
  ]);
  const active = leases.filter((token) => token !== undefined);
  assert.equal(active.length, 1);
  const [token] = active;
  assert.ok(token);
  assert.equal(await refreshBlogGenerationLock(scope, token), true);
  await releaseBlogGenerationLock(scope, token);
  const next = await acquireBlogGenerationLock(scope);
  assert.ok(next);
  assert.equal(await refreshBlogGenerationLock(scope, token), false);

  await writeBlogFingerprints(scope, [
    { documentId: "similar", revision: "a", topic: vector, body: vector },
    { documentId: "rejected", revision: "b", topic: null, body: null },
  ]);
  const matches = await findSimilarBlogFingerprints({
    scope,
    documentIds: ["similar", "rejected"],
    topic: vector,
    body: vector,
    maximumTopicDistance: 0.1,
    maximumBodyDistance: 0.1,
  });
  assert.deepEqual(matches, [{ documentId: "similar" }]);
});

void test("isolates vectors and preserves keyword results when embeddings are unavailable", async (t) => {
  const sanityDocumentId = "integration-knowledge";
  t.after(async () => {
    await db
      .delete(knowledgeDocuments)
      .where(eq(knowledgeDocuments.sanityDocumentId, sanityDocumentId));
  });
  await replaceIndexedKnowledgeDocument({
    document: {
      sanityDocumentId,
      sourceType: "blog",
      title: "PostgreSQL maintenance",
      canonicalUrl: "https://example.com/blogs/postgresql-maintenance",
      contentHash: "fixture",
      sanityUpdatedAt: new Date(),
      metadata: { embeddingModel: model, indexVersion },
    },
    chunks: [
      {
        chunkIndex: 0,
        content: "Index maintenance",
        embedding: vector,
        metadata: {},
        tokenCount: 3,
      },
      { chunkIndex: 1, content: "Transaction lock", embedding: null, metadata: {}, tokenCount: 3 },
    ],
  });

  const sourceTypes = ["blog"] as const;
  const semanticOptions = {
    embedding: vector,
    sourceTypes: [...sourceTypes],
    limit: 5,
    indexVersion,
  };
  assert.deepEqual(
    (await findSemanticKnowledgeCandidates({ ...semanticOptions, embeddingModel: model })).map(
      ({ content, semanticSimilarity }) => [content, semanticSimilarity],
    ),
    [["Index maintenance", 1]],
  );
  assert.equal(
    (await findSemanticKnowledgeCandidates({ ...semanticOptions, embeddingModel: "legacy" }))
      .length,
    0,
  );
  assert.deepEqual(
    (
      await findKeywordKnowledgeCandidates({
        query: "transaction lock",
        sourceTypes: [...sourceTypes],
        limit: 5,
        indexVersion,
        embeddingModel: model,
      })
    ).map(({ content }) => content),
    ["Transaction lock"],
  );
});
