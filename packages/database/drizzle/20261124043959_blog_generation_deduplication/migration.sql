CREATE TABLE "blog_fingerprints" (
	"scope" text,
	"document_id" text,
	"revision" text NOT NULL,
	"model" text NOT NULL,
	"topic" vector(4096) NOT NULL,
	"body" vector(4096) NOT NULL,
	CONSTRAINT "blog_fingerprints_pkey" PRIMARY KEY("scope","document_id")
);
--> statement-breakpoint
CREATE TABLE "blog_generation_locks" (
	"scope" text PRIMARY KEY,
	"token" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
