ALTER TABLE "notification_events" ADD COLUMN "email_materialized_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN "push_materialized_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN "webhook_materialized_at" timestamp with time zone;