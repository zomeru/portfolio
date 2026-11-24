CREATE TABLE "knowledge_chunks_v2" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"document_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(4096) NOT NULL,
	"search" tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce("knowledge_chunks_v2"."content", ''))) STORED NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"token_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_documents_v2" (
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
CREATE UNIQUE INDEX "knowledge_chunks_v2_document_chunk_idx" ON "knowledge_chunks_v2" ("document_id","chunk_index");--> statement-breakpoint
CREATE INDEX "knowledge_chunks_v2_search_idx" ON "knowledge_chunks_v2" USING gin ("search");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_documents_v2_sanity_document_id_idx" ON "knowledge_documents_v2" ("sanity_document_id");--> statement-breakpoint
CREATE INDEX "knowledge_documents_v2_source_type_idx" ON "knowledge_documents_v2" ("source_type");--> statement-breakpoint
ALTER TABLE "knowledge_chunks_v2" ADD CONSTRAINT "knowledge_chunks_v2_document_id_knowledge_documents_v2_id_fkey" FOREIGN KEY ("document_id") REFERENCES "knowledge_documents_v2"("id") ON DELETE CASCADE;