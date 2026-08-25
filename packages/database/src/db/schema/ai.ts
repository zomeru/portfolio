import { type SQL, sql } from "drizzle-orm";
import {
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";

export const knowledgeSourceType = pgEnum("knowledge_source_type", [
  "profile",
  "experience",
  "project",
  "blog",
  "techstack",
]);

export const chatMessageRole = pgEnum("chat_message_role", ["user", "assistant"]);

export const queryIntent = pgEnum("query_intent", [
  "general",
  "profile",
  "experience",
  "project",
  "blog",
  "portfolio",
  "navigation",
  "techstack",
]);

export const ingestionStatus = pgEnum("ingestion_status", ["running", "succeeded", "failed"]);

export const ingestionTrigger = pgEnum("ingestion_trigger", [
  "cli",
  "admin",
  "scheduled",
  "webhook",
]);

const tsvector = customType<{ data: string }>({
  dataType: () => "tsvector",
});

export type KnowledgeMetadata = Record<string, unknown>;

export const knowledgeDocuments = pgTable(
  "knowledge_documents",
  {
    id: uuid().defaultRandom().primaryKey(),
    sanityDocumentId: varchar("sanity_document_id", { length: 255 }).notNull(),
    sourceType: knowledgeSourceType("source_type").notNull(),
    slug: varchar({ length: 255 }),
    title: text().notNull(),
    canonicalUrl: text("canonical_url").notNull(),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    metadata: jsonb().$type<KnowledgeMetadata>().notNull().default({}),
    sanityUpdatedAt: timestamp("sanity_updated_at", { withTimezone: true }).notNull(),
    indexedAt: timestamp("indexed_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("knowledge_documents_sanity_document_id_idx").on(table.sanityDocumentId),
    index("knowledge_documents_source_type_idx").on(table.sourceType),
    index("knowledge_documents_slug_idx").on(table.slug),
  ],
);

export const knowledgeChunks = pgTable(
  "knowledge_chunks",
  {
    id: uuid().defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    content: text().notNull(),
    embedding: vector({ dimensions: 2048 }).notNull(),
    search: tsvector("search")
      .notNull()
      .generatedAlwaysAs(
        (): SQL => sql`to_tsvector('english', coalesce(${knowledgeChunks.content}, ''))`,
      ),
    metadata: jsonb().$type<KnowledgeMetadata>().notNull().default({}),
    tokenCount: integer("token_count").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("knowledge_chunks_document_chunk_idx").on(table.documentId, table.chunkIndex),
    index("knowledge_chunks_document_id_idx").on(table.documentId),
    index("knowledge_chunks_search_idx").using("gin", table.search),
  ],
);

export const ingestionRuns = pgTable(
  "ingestion_runs",
  {
    id: uuid().defaultRandom().primaryKey(),
    status: ingestionStatus().notNull().default("running"),
    trigger: ingestionTrigger().notNull(),
    lockKey: varchar("lock_key", { length: 32 }),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    documentsSeen: integer("documents_seen").notNull().default(0),
    documentsCreated: integer("documents_created").notNull().default(0),
    documentsUpdated: integer("documents_updated").notNull().default(0),
    documentsUnchanged: integer("documents_unchanged").notNull().default(0),
    documentsDeleted: integer("documents_deleted").notNull().default(0),
    chunksCreated: integer("chunks_created").notNull().default(0),
    error: text(),
    metadata: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  },
  (table) => [
    uniqueIndex("ingestion_runs_lock_key_idx").on(table.lockKey),
    index("ingestion_runs_started_at_idx").on(table.startedAt),
    index("ingestion_runs_status_started_at_idx").on(table.status, table.startedAt),
  ],
);

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: uuid().defaultRandom().primaryKey(),
    sessionKey: uuid("session_key").notNull(),
    summary: text(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("chat_sessions_session_key_idx").on(table.sessionKey),
    index("chat_sessions_last_message_at_idx").on(table.lastMessageAt),
  ],
);

export type ChatCitation = {
  id: string;
  title: string;
  url: string;
  sourceType: (typeof knowledgeSourceType.enumValues)[number] | "web";
};

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid().defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    providerMessageId: varchar("provider_message_id", { length: 255 }),
    role: chatMessageRole().notNull(),
    content: text().notNull(),
    intent: queryIntent(),
    model: varchar({ length: 255 }),
    citations: jsonb().$type<ChatCitation[]>().notNull().default([]),
    suggestions: jsonb().$type<string[]>().notNull().default([]),
    tokenCount: integer("token_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("chat_messages_session_created_at_idx").on(table.sessionId, table.createdAt),
    uniqueIndex("chat_messages_provider_message_id_idx").on(table.providerMessageId),
  ],
);

export type RetrievalResultMetadata = {
  chunkId: string;
  documentId: string;
  structuredRank?: number;
  semanticRank?: number;
  semanticSimilarity?: number;
  keywordRank?: number;
  score: number;
};

export const retrievalEvents = pgTable(
  "retrieval_events",
  {
    id: uuid().defaultRandom().primaryKey(),
    sessionId: uuid("session_id").references(() => chatSessions.id, { onDelete: "set null" }),
    messageId: uuid("message_id").references(() => chatMessages.id, { onDelete: "set null" }),
    query: text().notNull(),
    intent: queryIntent().notNull(),
    results: jsonb().$type<RetrievalResultMetadata[]>().notNull().default([]),
    latencyMs: integer("latency_ms").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("retrieval_events_session_created_at_idx").on(table.sessionId, table.createdAt),
    index("retrieval_events_message_id_idx").on(table.messageId),
  ],
);
