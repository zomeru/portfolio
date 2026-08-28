import {
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
} from "drizzle-orm/pg-core";

export const emailSubscriptionStatus = pgEnum("email_subscription_status", [
  "pending",
  "confirmed",
  "unsubscribed",
  "suppressed",
]);

export const webhookDestinationType = pgEnum("webhook_destination_type", [
  "generic",
  "slack",
  "discord",
]);

export const webhookSubscriptionStatus = pgEnum("webhook_subscription_status", [
  "active",
  "disabled",
]);

export const notificationEventType = pgEnum("notification_event_type", ["blog.published"]);

export const notificationDeliveryChannel = pgEnum("notification_delivery_channel", [
  "email",
  "push",
  "webhook",
]);

export const notificationDeliveryStatus = pgEnum("notification_delivery_status", [
  "pending",
  "processing",
  "delivered",
  "failed",
]);

export type StoredBlogPublishedEvent = {
  id: string;
  type: "blog.published";
  apiVersion: "1";
  createdAt: string;
  data: {
    blog: {
      id: string;
      revision: string;
      title: string;
      slug: string;
      excerpt?: string;
      publishedAt: string;
      url: string;
    };
  };
};

export const blogEmailSubscriptions = pgTable(
  "blog_email_subscriptions",
  {
    id: uuid().defaultRandom().primaryKey(),
    email: varchar({ length: 320 }).notNull(),
    status: emailSubscriptionStatus().notNull().default("pending"),
    verificationTokenHash: varchar("verification_token_hash", { length: 64 }),
    verificationExpiresAt: timestamp("verification_expires_at", { withTimezone: true }),
    unsubscribeTokenVersion: integer("unsubscribe_token_version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    suppressedAt: timestamp("suppressed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("blog_email_subscriptions_email_idx").on(table.email),
    uniqueIndex("blog_email_subscriptions_verification_token_idx").on(table.verificationTokenHash),
    index("blog_email_subscriptions_status_idx").on(table.status),
  ],
);

export const blogPushSubscriptions = pgTable(
  "blog_push_subscriptions",
  {
    id: uuid().defaultRandom().primaryKey(),
    endpoint: text().notNull(),
    p256dh: text().notNull(),
    auth: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("blog_push_subscriptions_endpoint_idx").on(table.endpoint),
    index("blog_push_subscriptions_disabled_at_idx").on(table.disabledAt),
  ],
);

export const blogWebhookSubscriptions = pgTable(
  "blog_webhook_subscriptions",
  {
    id: uuid().defaultRandom().primaryKey(),
    name: varchar({ length: 100 }).notNull(),
    destinationType: webhookDestinationType("destination_type").notNull(),
    urlHash: varchar("url_hash", { length: 64 }).notNull(),
    encryptedUrl: text("encrypted_url").notNull(),
    encryptedSecret: text("encrypted_secret"),
    status: webhookSubscriptionStatus().notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("blog_webhook_subscriptions_url_hash_idx").on(table.urlHash),
    index("blog_webhook_subscriptions_status_idx").on(table.status),
  ],
);

export const notificationEvents = pgTable(
  "notification_events",
  {
    id: uuid().defaultRandom().primaryKey(),
    eventKey: varchar("event_key", { length: 128 }).notNull(),
    type: notificationEventType().notNull(),
    sourceId: varchar("source_id", { length: 255 }).notNull(),
    sourceRevision: varchar("source_revision", { length: 255 }).notNull(),
    payload: jsonb().$type<StoredBlogPublishedEvent>().notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    emailMaterializedAt: timestamp("email_materialized_at", { withTimezone: true }),
    pushMaterializedAt: timestamp("push_materialized_at", { withTimezone: true }),
    webhookMaterializedAt: timestamp("webhook_materialized_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("notification_events_event_key_idx").on(table.eventKey),
    index("notification_events_occurred_at_idx").on(table.occurredAt),
  ],
);

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: uuid().defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => notificationEvents.id, { onDelete: "cascade" }),
    channel: notificationDeliveryChannel().notNull(),
    destinationId: uuid("destination_id").notNull(),
    status: notificationDeliveryStatus().notNull().default("pending"),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).defaultNow().notNull(),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    lastAttemptedAt: timestamp("last_attempted_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    httpStatus: integer("http_status"),
    providerMessageId: varchar("provider_message_id", { length: 255 }),
    errorCode: varchar("error_code", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("notification_deliveries_destination_idx").on(
      table.eventId,
      table.channel,
      table.destinationId,
    ),
    index("notification_deliveries_ready_idx").on(table.status, table.nextAttemptAt),
  ],
);

export const notificationRateLimits = pgTable(
  "notification_rate_limits",
  {
    id: uuid().defaultRandom().primaryKey(),
    scope: varchar({ length: 64 }).notNull(),
    keyHash: varchar("key_hash", { length: 64 }).notNull(),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
    count: integer().notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("notification_rate_limits_window_idx").on(
      table.scope,
      table.keyHash,
      table.windowStartedAt,
    ),
    index("notification_rate_limits_updated_at_idx").on(table.updatedAt),
  ],
);
