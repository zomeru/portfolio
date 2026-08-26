CREATE TYPE "email_subscription_status" AS ENUM('pending', 'active', 'unsubscribed', 'suppressed');--> statement-breakpoint
CREATE TYPE "notification_delivery_channel" AS ENUM('email', 'push', 'webhook');--> statement-breakpoint
CREATE TYPE "notification_delivery_status" AS ENUM('pending', 'processing', 'delivered', 'failed');--> statement-breakpoint
CREATE TYPE "notification_event_type" AS ENUM('blog.published');--> statement-breakpoint
CREATE TYPE "webhook_destination_type" AS ENUM('generic', 'slack', 'discord');--> statement-breakpoint
CREATE TYPE "webhook_subscription_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TABLE "blog_email_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" varchar(320) NOT NULL,
	"status" "email_subscription_status" DEFAULT 'pending'::"email_subscription_status" NOT NULL,
	"verification_token_hash" varchar(64),
	"verification_expires_at" timestamp with time zone,
	"unsubscribe_token_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"suppressed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "blog_push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disabled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "blog_webhook_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL,
	"destination_type" "webhook_destination_type" NOT NULL,
	"url_hash" varchar(64) NOT NULL,
	"encrypted_url" text NOT NULL,
	"encrypted_secret" text,
	"status" "webhook_subscription_status" DEFAULT 'active'::"webhook_subscription_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disabled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"channel" "notification_delivery_channel" NOT NULL,
	"destination_id" uuid NOT NULL,
	"status" "notification_delivery_status" DEFAULT 'pending'::"notification_delivery_status" NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"claimed_at" timestamp with time zone,
	"last_attempted_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"http_status" integer,
	"provider_message_id" varchar(255),
	"error_code" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_key" varchar(128) NOT NULL,
	"type" "notification_event_type" NOT NULL,
	"source_id" varchar(255) NOT NULL,
	"source_revision" varchar(255) NOT NULL,
	"payload" jsonb NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"scope" varchar(64) NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "blog_email_subscriptions_email_idx" ON "blog_email_subscriptions" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_email_subscriptions_verification_token_idx" ON "blog_email_subscriptions" ("verification_token_hash");--> statement-breakpoint
CREATE INDEX "blog_email_subscriptions_status_idx" ON "blog_email_subscriptions" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_push_subscriptions_endpoint_idx" ON "blog_push_subscriptions" ("endpoint");--> statement-breakpoint
CREATE INDEX "blog_push_subscriptions_disabled_at_idx" ON "blog_push_subscriptions" ("disabled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_webhook_subscriptions_url_hash_idx" ON "blog_webhook_subscriptions" ("url_hash");--> statement-breakpoint
CREATE INDEX "blog_webhook_subscriptions_status_idx" ON "blog_webhook_subscriptions" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_deliveries_destination_idx" ON "notification_deliveries" ("event_id","channel","destination_id");--> statement-breakpoint
CREATE INDEX "notification_deliveries_ready_idx" ON "notification_deliveries" ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "notification_deliveries_event_channel_idx" ON "notification_deliveries" ("event_id","channel");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_events_event_key_idx" ON "notification_events" ("event_key");--> statement-breakpoint
CREATE INDEX "notification_events_source_idx" ON "notification_events" ("source_id","source_revision");--> statement-breakpoint
CREATE INDEX "notification_events_occurred_at_idx" ON "notification_events" ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_rate_limits_window_idx" ON "notification_rate_limits" ("scope","key_hash","window_started_at");--> statement-breakpoint
CREATE INDEX "notification_rate_limits_updated_at_idx" ON "notification_rate_limits" ("updated_at");--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_event_id_notification_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "notification_events"("id") ON DELETE CASCADE;