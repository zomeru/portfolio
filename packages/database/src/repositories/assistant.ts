import { randomUUID } from "node:crypto";
import { and, count, desc, eq, gte, inArray, lt, notInArray, sql } from "drizzle-orm";
import { db } from "../client";
import {
  type ChatCitation,
  chatMessages,
  chatSessions,
  ingestionRuns,
  type KnowledgeMetadata,
  knowledgeChunks,
  knowledgeDocuments,
  type RetrievalResultMetadata,
  retrievalEvents,
} from "../db/schema/ai";

export type QueryIntentValue = (typeof chatMessages.$inferInsert)["intent"];
export type KnowledgeSourceTypeValue = (typeof knowledgeDocuments.$inferSelect)["sourceType"];
export type IngestionTriggerValue = (typeof ingestionRuns.$inferInsert)["trigger"];

const EMBEDDING_DIMENSION = 2048;

export type KnowledgeCandidate = {
  chunkId: string;
  documentId: string;
  content: string;
  metadata: KnowledgeMetadata;
  sourceType: KnowledgeSourceTypeValue;
  title: string;
  canonicalUrl: string;
};

export type KnowledgeDocumentWrite = {
  sanityDocumentId: string;
  sourceType: KnowledgeSourceTypeValue;
  slug?: string | null;
  title: string;
  canonicalUrl: string;
  contentHash: string;
  metadata: KnowledgeMetadata;
  sanityUpdatedAt: Date;
};

export type KnowledgeChunkWrite = {
  chunkIndex: number;
  content: string;
  embedding: number[];
  metadata: KnowledgeMetadata;
  tokenCount: number;
};

export async function createOrTouchChatSession(sessionKey: string) {
  const now = new Date();
  const [session] = await db
    .insert(chatSessions)
    .values({ sessionKey, updatedAt: now })
    .onConflictDoUpdate({
      target: chatSessions.sessionKey,
      set: { updatedAt: now },
    })
    .returning();
  return session;
}

export async function countUserMessagesSince(sessionId: string, since: Date) {
  const [result] = await db
    .select({ value: count() })
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.sessionId, sessionId),
        eq(chatMessages.role, "user"),
        gte(chatMessages.createdAt, since),
      ),
    );
  return result?.value ?? 0;
}

export function listRecentChatMessages(sessionId: string, limit: number) {
  return db
    .select({
      id: chatMessages.id,
      role: chatMessages.role,
      content: chatMessages.content,
      intent: chatMessages.intent,
      createdAt: chatMessages.createdAt,
      tokenCount: chatMessages.tokenCount,
    })
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
}

export async function createUserChatMessage(options: {
  sessionId: string;
  providerMessageId: string;
  content: string;
  intent: QueryIntentValue;
  tokenCount: number;
}) {
  const now = new Date();
  const [created] = await db.batch([
    db
      .insert(chatMessages)
      .values({ ...options, role: "user" })
      .onConflictDoNothing({ target: chatMessages.providerMessageId })
      .returning(),
    db
      .update(chatSessions)
      .set({ updatedAt: now, lastMessageAt: now })
      .where(eq(chatSessions.id, options.sessionId)),
  ]);
  return created[0];
}

export async function findChatMessageByProviderId(providerMessageId: string) {
  const [message] = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.providerMessageId, providerMessageId))
    .limit(1);
  return message;
}

export async function createAssistantChatMessage(options: {
  sessionId: string;
  providerMessageId: string;
  content: string;
  intent: QueryIntentValue;
  model: string;
  citations: ChatCitation[];
  suggestions: string[];
  tokenCount: number;
}) {
  const now = new Date();
  await db.batch([
    db
      .insert(chatMessages)
      .values({ ...options, role: "assistant" })
      .onConflictDoNothing({ target: chatMessages.providerMessageId }),
    db
      .update(chatSessions)
      .set({ updatedAt: now, lastMessageAt: now })
      .where(eq(chatSessions.id, options.sessionId)),
  ]);
}

export async function findChatSessionByKey(sessionKey: string) {
  const [session] = await db
    .select({ id: chatSessions.id })
    .from(chatSessions)
    .where(eq(chatSessions.sessionKey, sessionKey))
    .limit(1);
  return session;
}

export function listStoredChatMessages(sessionId: string, limit: number) {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
}

const candidateSelection = {
  chunkId: knowledgeChunks.id,
  documentId: knowledgeDocuments.id,
  content: knowledgeChunks.content,
  metadata: knowledgeChunks.metadata,
  sourceType: knowledgeDocuments.sourceType,
  title: knowledgeDocuments.title,
  canonicalUrl: knowledgeDocuments.canonicalUrl,
};

export function findSemanticKnowledgeCandidates(options: {
  embedding: number[];
  sourceTypes: KnowledgeSourceTypeValue[];
  limit: number;
}) {
  const vectorValue = JSON.stringify(options.embedding);
  const distance = sql<number>`(${knowledgeChunks.embedding}::halfvec(${EMBEDDING_DIMENSION}) <=> ${vectorValue}::halfvec(${EMBEDDING_DIMENSION}))`;
  return db
    .select(candidateSelection)
    .from(knowledgeChunks)
    .innerJoin(knowledgeDocuments, eq(knowledgeChunks.documentId, knowledgeDocuments.id))
    .where(inArray(knowledgeDocuments.sourceType, options.sourceTypes))
    .orderBy(distance)
    .limit(options.limit);
}

export function findKeywordKnowledgeCandidates(options: {
  query: string;
  sourceTypes: KnowledgeSourceTypeValue[];
  limit: number;
}) {
  const textQuery = sql`websearch_to_tsquery('english', ${options.query})`;
  const rank = sql<number>`ts_rank_cd(${knowledgeChunks.search}, ${textQuery})`;
  return db
    .select(candidateSelection)
    .from(knowledgeChunks)
    .innerJoin(knowledgeDocuments, eq(knowledgeChunks.documentId, knowledgeDocuments.id))
    .where(
      and(
        inArray(knowledgeDocuments.sourceType, options.sourceTypes),
        sql`${knowledgeChunks.search} @@ ${textQuery}`,
      ),
    )
    .orderBy(desc(rank))
    .limit(options.limit);
}

export async function findLatestKnowledgeCandidates(options: {
  sourceType: "blog" | "experience";
  limit: number;
}) {
  const recency =
    options.sourceType === "blog"
      ? sql`coalesce(nullif(${knowledgeDocuments.metadata}->>'publishedAt', '')::timestamptz, ${knowledgeDocuments.sanityUpdatedAt})`
      : sql`coalesce(nullif(${knowledgeDocuments.metadata}->>'periodEnd', '')::date, ${knowledgeDocuments.sanityUpdatedAt}::date)`;
  const [latestDocument] = await db
    .select({ id: knowledgeDocuments.id })
    .from(knowledgeDocuments)
    .where(eq(knowledgeDocuments.sourceType, options.sourceType))
    .orderBy(desc(recency), desc(knowledgeDocuments.sanityUpdatedAt))
    .limit(1);

  if (!latestDocument) return [];

  return db
    .select(candidateSelection)
    .from(knowledgeChunks)
    .innerJoin(knowledgeDocuments, eq(knowledgeChunks.documentId, knowledgeDocuments.id))
    .where(eq(knowledgeDocuments.id, latestDocument.id))
    .orderBy(knowledgeChunks.chunkIndex)
    .limit(options.limit);
}

export function findExperienceOverviewCandidates(limit: number) {
  const recency = sql`coalesce(nullif(${knowledgeDocuments.metadata}->>'periodEnd', '')::date, ${knowledgeDocuments.sanityUpdatedAt}::date)`;
  return db
    .select(candidateSelection)
    .from(knowledgeChunks)
    .innerJoin(knowledgeDocuments, eq(knowledgeChunks.documentId, knowledgeDocuments.id))
    .where(and(eq(knowledgeDocuments.sourceType, "experience"), eq(knowledgeChunks.chunkIndex, 0)))
    .orderBy(desc(recency), desc(knowledgeDocuments.sanityUpdatedAt))
    .limit(limit);
}

export async function createRetrievalEvent(options: {
  sessionId?: string;
  messageId?: string;
  query: string;
  intent: NonNullable<QueryIntentValue>;
  results: RetrievalResultMetadata[];
  latencyMs: number;
}) {
  await db.insert(retrievalEvents).values(options);
}

export async function expireStaleIngestionRuns(staleBefore: Date) {
  await db
    .update(ingestionRuns)
    .set({
      status: "failed",
      completedAt: new Date(),
      lockKey: null,
      error: "The indexing process stopped before completion.",
    })
    .where(and(eq(ingestionRuns.status, "running"), lt(ingestionRuns.startedAt, staleBefore)));
}

export async function createIngestionRun(options: {
  trigger: IngestionTriggerValue;
  lockKey: string;
  force: boolean;
}) {
  const [run] = await db
    .insert(ingestionRuns)
    .values({
      trigger: options.trigger,
      lockKey: options.lockKey,
      metadata: { force: options.force },
    })
    .returning();
  return run;
}

export function listIndexedKnowledgeDocuments() {
  return db
    .select({
      id: knowledgeDocuments.id,
      sanityDocumentId: knowledgeDocuments.sanityDocumentId,
      contentHash: knowledgeDocuments.contentHash,
    })
    .from(knowledgeDocuments);
}

export async function touchIndexedKnowledgeDocument(id: string, sanityUpdatedAt: Date) {
  await db.update(knowledgeDocuments).set({ sanityUpdatedAt }).where(eq(knowledgeDocuments.id, id));
}

export async function replaceIndexedKnowledgeDocument(options: {
  document: KnowledgeDocumentWrite;
  chunks: KnowledgeChunkWrite[];
  existingId?: string;
}) {
  const now = new Date();
  const values = { ...options.document, indexedAt: now, updatedAt: now };
  const documentId = options.existingId ?? randomUUID();
  const chunkValues = options.chunks.map((chunk) => ({
    ...chunk,
    documentId,
    updatedAt: now,
  }));

  if (options.existingId) {
    const updateDocument = db
      .update(knowledgeDocuments)
      .set(values)
      .where(eq(knowledgeDocuments.id, documentId));
    const deleteChunks = db
      .delete(knowledgeChunks)
      .where(eq(knowledgeChunks.documentId, documentId));
    if (chunkValues.length > 0) {
      await db.batch([
        updateDocument,
        deleteChunks,
        db.insert(knowledgeChunks).values(chunkValues),
      ]);
    } else {
      await db.batch([updateDocument, deleteChunks]);
    }
    return;
  }

  const createDocument = db.insert(knowledgeDocuments).values({
    id: documentId,
    ...values,
  });
  if (chunkValues.length > 0) {
    await db.batch([createDocument, db.insert(knowledgeChunks).values(chunkValues)]);
  } else {
    await db.batch([createDocument]);
  }
}

export async function deleteKnowledgeDocumentsNotIn(sanityDocumentIds: string[]) {
  if (sanityDocumentIds.length === 0) return 0;
  const deleted = await db
    .delete(knowledgeDocuments)
    .where(notInArray(knowledgeDocuments.sanityDocumentId, sanityDocumentIds))
    .returning({ id: knowledgeDocuments.id });
  return deleted.length;
}

export async function failIngestionRun(runId: string, error: string) {
  await db
    .update(ingestionRuns)
    .set({ status: "failed", completedAt: new Date(), lockKey: null, error })
    .where(eq(ingestionRuns.id, runId));
}

export async function completeIngestionRun(
  runId: string,
  summary: {
    documentsSeen: number;
    documentsCreated: number;
    documentsUpdated: number;
    documentsUnchanged: number;
    documentsDeleted: number;
    chunksCreated: number;
    force: boolean;
    embeddingModel: string;
  },
) {
  await db
    .update(ingestionRuns)
    .set({
      status: "succeeded",
      completedAt: new Date(),
      lockKey: null,
      documentsSeen: summary.documentsSeen,
      documentsCreated: summary.documentsCreated,
      documentsUpdated: summary.documentsUpdated,
      documentsUnchanged: summary.documentsUnchanged,
      documentsDeleted: summary.documentsDeleted,
      chunksCreated: summary.chunksCreated,
      metadata: { force: summary.force, embeddingModel: summary.embeddingModel },
    })
    .where(eq(ingestionRuns.id, runId));
}

export async function readKnowledgeIndexStatus() {
  const [[documentCount], [chunkCount], [latestRun]] = await Promise.all([
    db.select({ value: count() }).from(knowledgeDocuments),
    db.select({ value: count() }).from(knowledgeChunks),
    db.select().from(ingestionRuns).orderBy(desc(ingestionRuns.startedAt)).limit(1),
  ]);
  return {
    documents: documentCount?.value ?? 0,
    chunks: chunkCount?.value ?? 0,
    latestRun: latestRun ?? null,
  };
}

export function listRecentIngestionRuns(limit = 20) {
  return db.select().from(ingestionRuns).orderBy(desc(ingestionRuns.startedAt)).limit(limit);
}
