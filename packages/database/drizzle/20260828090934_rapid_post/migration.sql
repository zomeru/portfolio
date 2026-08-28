CREATE TYPE "application_error_severity" AS ENUM('error', 'warning');--> statement-breakpoint
CREATE TYPE "application_error_status" AS ENUM('open', 'resolved', 'ignored');--> statement-breakpoint
CREATE TABLE "application_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"fingerprint" varchar(64) NOT NULL,
	"severity" "application_error_severity" DEFAULT 'error'::"application_error_severity" NOT NULL,
	"name" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"stack" text,
	"source" varchar(1024),
	"route" varchar(512),
	"method" varchar(16),
	"request_id" varchar(255),
	"user_agent" varchar(1024),
	"environment" varchar(64) NOT NULL,
	"service" varchar(100) NOT NULL,
	"error_code" varchar(255),
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"cause" jsonb,
	"status" "application_error_status" DEFAULT 'open'::"application_error_status" NOT NULL,
	"occurrence_count" integer DEFAULT 1 NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
DROP INDEX "chat_messages_session_created_at_idx";--> statement-breakpoint
CREATE INDEX "chat_messages_session_created_at_id_idx" ON "chat_messages" ("session_id","created_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "application_errors_fingerprint_idx" ON "application_errors" ("fingerprint");--> statement-breakpoint
CREATE INDEX "application_errors_last_seen_id_idx" ON "application_errors" ("last_seen_at","id");--> statement-breakpoint
CREATE INDEX "application_errors_status_last_seen_id_idx" ON "application_errors" ("status","last_seen_at","id");--> statement-breakpoint
CREATE INDEX "application_errors_severity_last_seen_id_idx" ON "application_errors" ("severity","last_seen_at","id");