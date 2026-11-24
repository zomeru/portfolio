ALTER TABLE "knowledge_chunks_v2" ALTER COLUMN "embedding" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_fingerprints" ALTER COLUMN "topic" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_fingerprints" ALTER COLUMN "body" DROP NOT NULL;