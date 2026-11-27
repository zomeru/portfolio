import assert from "node:assert/strict";
import test from "node:test";

import { ASSISTANT_EMBEDDING } from "@portfolio/env/embedding";
import { eq, inArray } from "drizzle-orm";

import { db } from "../client";
import { knowledgeDocuments } from "../db/schema/ai";
import { blogFingerprints, blogGenerationLocks } from "../db/schema/blog-generation";
import {
  blogEmailSubscriptions,
  blogPushSubscriptions,
  blogWebhookSubscriptions,
  notificationEvents,
} from "../db/schema/notifications";
import {
  findKeywordKnowledgeCandidates,
  findSemanticKnowledgeCandidates,
  readKnowledgeIndexStatus,
  replaceIndexedKnowledgeDocument,
} from "./assistant";
import {
  acquireBlogGenerationLock,
  findSimilarBlogFingerprints,
  refreshBlogGenerationLock,
  releaseBlogGenerationLock,
  writeBlogFingerprints,
} from "./blog-generation";
import {
  createNotificationEvent,
  getNotificationAdminSummary,
  listIncompleteNotificationEventMaterializations,
  materializeNotificationDeliveries,
} from "./notifications";

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

  const status = await readKnowledgeIndexStatus();
  assert.equal(status.documents, 1);
  assert.equal(status.chunks, 2);

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

void test("loads notification dashboard counts on the empty test database", async () => {
  assert.deepEqual(await getNotificationAdminSummary(), {
    counts: { email: 0, push: 0, webhook: 0 },
    latestEvent: null,
    deliveries: [],
  });
});

void test("materializes only eligible recipients, atomically and idempotently", async (t) => {
  const occurredAt = new Date("2026-11-01T00:00:00Z");
  const payload = {
    id: "fixture-event",
    type: "blog.published",
    apiVersion: "1",
    createdAt: occurredAt.toISOString(),
    data: {
      blog: {
        id: "fixture-blog",
        revision: "rev1",
        title: "Fixture Blog",
        slug: "fixture-blog",
        publishedAt: occurredAt.toISOString(),
        url: "https://example.com/blogs/fixture-blog",
      },
    },
  } as const;
  const { event } = await createNotificationEvent({
    eventKey: "fixture-event",
    sourceId: payload.data.blog.id,
    sourceRevision: payload.data.blog.revision,
    occurredAt,
    payload,
  });
  t.after(async () => {
    await db.delete(notificationEvents).where(eq(notificationEvents.id, event.id));
    await db
      .delete(blogEmailSubscriptions)
      .where(
        inArray(blogEmailSubscriptions.email, [
          "eligible@example.com",
          "late@example.com",
          "pending@example.com",
        ]),
      );
    await db
      .delete(blogPushSubscriptions)
      .where(
        inArray(blogPushSubscriptions.endpoint, [
          "https://example.com/push-eligible",
          "https://example.com/push-disabled",
        ]),
      );
    await db
      .delete(blogWebhookSubscriptions)
      .where(inArray(blogWebhookSubscriptions.urlHash, ["eligible", "disabled"]));
  });
  const eligible = new Date(event.createdAt.getTime() - 1_000);
  const late = new Date(event.createdAt.getTime() + 1_000);
  await db.insert(blogEmailSubscriptions).values([
    { email: "eligible@example.com", status: "confirmed", verifiedAt: eligible },
    { email: "late@example.com", status: "confirmed", verifiedAt: late },
    { email: "pending@example.com", status: "pending" },
  ]);
  await db.insert(blogPushSubscriptions).values([
    {
      endpoint: "https://example.com/push-eligible",
      p256dh: "fixture",
      auth: "fixture",
      createdAt: eligible,
    },
    {
      endpoint: "https://example.com/push-disabled",
      p256dh: "fixture",
      auth: "fixture",
      createdAt: eligible,
      disabledAt: eligible,
    },
  ]);
  await db.insert(blogWebhookSubscriptions).values([
    {
      name: "Eligible",
      destinationType: "generic",
      urlHash: "eligible",
      encryptedUrl: "fixture",
      createdAt: eligible,
    },
    {
      name: "Disabled",
      destinationType: "generic",
      urlHash: "disabled",
      encryptedUrl: "fixture",
      createdAt: eligible,
      status: "disabled",
    },
  ]);
  for (const channel of ["email", "push", "webhook"] as const) {
    assert.equal(await materializeNotificationDeliveries(event.id, channel, event.createdAt), 1);
    assert.equal(await materializeNotificationDeliveries(event.id, channel, event.createdAt), 0);
  }

  const summary = await getNotificationAdminSummary();
  assert.equal(summary.latestEvent?.id, event.id);
  assert.equal(summary.deliveries.length, 3);
  assert(summary.deliveries.every(({ status, count }) => status === "pending" && count === 1));
  assert.equal((await listIncompleteNotificationEventMaterializations(1)).length, 0);
});
