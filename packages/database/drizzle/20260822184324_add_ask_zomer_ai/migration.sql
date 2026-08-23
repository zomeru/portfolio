CREATE TYPE "chat_message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "ingestion_status" AS ENUM('running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "ingestion_trigger" AS ENUM('cli', 'admin', 'scheduled', 'webhook');--> statement-breakpoint
CREATE TYPE "knowledge_source_type" AS ENUM('profile', 'experience', 'project', 'blog');--> statement-breakpoint
CREATE TYPE "query_intent" AS ENUM('general', 'profile', 'experience', 'project', 'blog', 'portfolio', 'navigation');--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_id" uuid NOT NULL,
	"provider_message_id" varchar(255),
	"role" "chat_message_role" NOT NULL,
	"content" text NOT NULL,
	"intent" "query_intent",
	"model" varchar(255),
	"citations" jsonb DEFAULT '[]' NOT NULL,
	"suggestions" jsonb DEFAULT '[]' NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_key" uuid NOT NULL,
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"status" "ingestion_status" DEFAULT 'running'::"ingestion_status" NOT NULL,
	"trigger" "ingestion_trigger" NOT NULL,
	"lock_key" varchar(32),
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"documents_seen" integer DEFAULT 0 NOT NULL,
	"documents_created" integer DEFAULT 0 NOT NULL,
	"documents_updated" integer DEFAULT 0 NOT NULL,
	"documents_unchanged" integer DEFAULT 0 NOT NULL,
	"documents_deleted" integer DEFAULT 0 NOT NULL,
	"chunks_created" integer DEFAULT 0 NOT NULL,
	"error" text,
	"metadata" jsonb DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"document_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(2048) NOT NULL,
	"search" tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce("knowledge_chunks"."content", ''))) STORED NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"token_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"sanity_document_id" varchar(255) NOT NULL,
	"source_type" "knowledge_source_type" NOT NULL,
	"slug" varchar(255),
	"title" text NOT NULL,
	"canonical_url" text NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"sanity_updated_at" timestamp with time zone NOT NULL,
	"indexed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retrieval_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_id" uuid,
	"message_id" uuid,
	"query" text NOT NULL,
	"intent" "query_intent" NOT NULL,
	"results" jsonb DEFAULT '[]' NOT NULL,
	"latency_ms" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "chat_messages_session_created_at_idx" ON "chat_messages" ("session_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_messages_provider_message_id_idx" ON "chat_messages" ("provider_message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_sessions_session_key_idx" ON "chat_sessions" ("session_key");--> statement-breakpoint
CREATE INDEX "chat_sessions_last_message_at_idx" ON "chat_sessions" ("last_message_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ingestion_runs_lock_key_idx" ON "ingestion_runs" ("lock_key");--> statement-breakpoint
CREATE INDEX "ingestion_runs_started_at_idx" ON "ingestion_runs" ("started_at");--> statement-breakpoint
CREATE INDEX "ingestion_runs_status_started_at_idx" ON "ingestion_runs" ("status","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_chunks_document_chunk_idx" ON "knowledge_chunks" ("document_id","chunk_index");--> statement-breakpoint
CREATE INDEX "knowledge_chunks_document_id_idx" ON "knowledge_chunks" ("document_id");--> statement-breakpoint
CREATE INDEX "knowledge_chunks_search_idx" ON "knowledge_chunks" USING gin ("search");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_documents_sanity_document_id_idx" ON "knowledge_documents" ("sanity_document_id");--> statement-breakpoint
CREATE INDEX "knowledge_documents_source_type_idx" ON "knowledge_documents" ("source_type");--> statement-breakpoint
CREATE INDEX "knowledge_documents_slug_idx" ON "knowledge_documents" ("slug");--> statement-breakpoint
CREATE INDEX "retrieval_events_session_created_at_idx" ON "retrieval_events" ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "retrieval_events_message_id_idx" ON "retrieval_events" ("message_id");--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_document_id_knowledge_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "retrieval_events" ADD CONSTRAINT "retrieval_events_session_id_chat_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "retrieval_events" ADD CONSTRAINT "retrieval_events_message_id_chat_messages_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE SET NULL;