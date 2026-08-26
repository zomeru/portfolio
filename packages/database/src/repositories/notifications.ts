import { and, asc, count, desc, eq, gt, gte, inArray, isNull, lt, lte, or, sql } from "drizzle-orm";

import { db } from "../client";
import {
  blogEmailSubscriptions,
  blogPushSubscriptions,
  blogWebhookSubscriptions,
  notificationDeliveries,
  notificationEvents,
  notificationRateLimits,
  type StoredBlogPublishedEvent,
} from "../db/schema";

export type NotificationDeliveryChannelValue =
  (typeof notificationDeliveries.$inferInsert)["channel"];
export type WebhookDestinationTypeValue =
  (typeof blogWebhookSubscriptions.$inferInsert)["destinationType"];

export async function createOrReuseEmailSubscription(options: {
  email: string;
  verificationTokenHash: string;
  verificationExpiresAt: Date;
}) {
  const now = new Date();
  const [inserted] = await db
    .insert(blogEmailSubscriptions)
    .values({
      email: options.email,
      verificationTokenHash: options.verificationTokenHash,
      verificationExpiresAt: options.verificationExpiresAt,
    })
    .onConflictDoNothing({ target: blogEmailSubscriptions.email })
    .returning();

  if (inserted) {
    return { subscription: inserted, outcome: "confirmation_required" as const };
  }

  const [existing] = await db
    .select()
    .from(blogEmailSubscriptions)
    .where(eq(blogEmailSubscriptions.email, options.email))
    .limit(1);

  if (!existing) throw new Error("Email subscription conflict could not be resolved.");
  if (existing.status === "active") {
    return { subscription: existing, outcome: "already_subscribed" as const };
  }
  if (existing.status === "suppressed") {
    return { subscription: existing, outcome: "suppressed" as const };
  }
  if (
    existing.status === "pending" &&
    existing.verificationExpiresAt &&
    existing.verificationExpiresAt > now
  ) {
    return { subscription: existing, outcome: "confirmation_pending" as const };
  }

  const reusableStatus = or(
    eq(blogEmailSubscriptions.status, "unsubscribed"),
    and(
      eq(blogEmailSubscriptions.status, "pending"),
      lte(blogEmailSubscriptions.verificationExpiresAt, now),
    ),
  );
  const [updated] = await db
    .update(blogEmailSubscriptions)
    .set({
      status: "pending",
      verificationTokenHash: options.verificationTokenHash,
      verificationExpiresAt: options.verificationExpiresAt,
      unsubscribeTokenVersion:
        existing.status === "unsubscribed"
          ? sql`${blogEmailSubscriptions.unsubscribeTokenVersion} + 1`
          : existing.unsubscribeTokenVersion,
      updatedAt: now,
      verifiedAt: null,
      unsubscribedAt: null,
    })
    .where(and(eq(blogEmailSubscriptions.id, existing.id), reusableStatus))
    .returning();

  if (updated) {
    return { subscription: updated, outcome: "confirmation_required" as const };
  }

  const [current] = await db
    .select()
    .from(blogEmailSubscriptions)
    .where(eq(blogEmailSubscriptions.id, existing.id))
    .limit(1);
  if (!current) throw new Error("Email subscription disappeared during update.");
  return {
    subscription: current,
    outcome:
      current.status === "active"
        ? ("already_subscribed" as const)
        : ("confirmation_pending" as const),
  };
}

export async function confirmEmailSubscription(tokenHash: string, now = new Date()) {
  const [subscription] = await db
    .update(blogEmailSubscriptions)
    .set({
      status: "active",
      verificationTokenHash: null,
      verificationExpiresAt: null,
      verifiedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(blogEmailSubscriptions.status, "pending"),
        eq(blogEmailSubscriptions.verificationTokenHash, tokenHash),
        gte(blogEmailSubscriptions.verificationExpiresAt, now),
      ),
    )
    .returning();
  return subscription ?? null;
}

export async function expireEmailVerificationToken(id: string, tokenHash: string) {
  const now = new Date();
  await db
    .update(blogEmailSubscriptions)
    .set({ verificationExpiresAt: now, updatedAt: now })
    .where(
      and(
        eq(blogEmailSubscriptions.id, id),
        eq(blogEmailSubscriptions.verificationTokenHash, tokenHash),
      ),
    );
}

export async function findEmailSubscriptionById(id: string) {
  const [subscription] = await db
    .select()
    .from(blogEmailSubscriptions)
    .where(eq(blogEmailSubscriptions.id, id))
    .limit(1);
  return subscription ?? null;
}

export async function unsubscribeEmailSubscription(id: string, tokenVersion: number) {
  const now = new Date();
  const [subscription] = await db
    .update(blogEmailSubscriptions)
    .set({
      status: "unsubscribed",
      verificationTokenHash: null,
      verificationExpiresAt: null,
      unsubscribedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(blogEmailSubscriptions.id, id),
        eq(blogEmailSubscriptions.unsubscribeTokenVersion, tokenVersion),
        inArray(blogEmailSubscriptions.status, ["pending", "active", "unsubscribed"]),
      ),
    )
    .returning();
  return subscription ?? null;
}

export async function suppressEmailSubscription(id: string) {
  const now = new Date();
  await db
    .update(blogEmailSubscriptions)
    .set({ status: "suppressed", suppressedAt: now, updatedAt: now })
    .where(eq(blogEmailSubscriptions.id, id));
}

export async function upsertPushSubscription(options: {
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  const now = new Date();
  const [subscription] = await db
    .insert(blogPushSubscriptions)
    .values({ ...options, createdAt: now, updatedAt: now, lastSeenAt: now })
    .onConflictDoUpdate({
      target: blogPushSubscriptions.endpoint,
      set: {
        p256dh: options.p256dh,
        auth: options.auth,
        disabledAt: null,
        lastSeenAt: now,
        updatedAt: now,
      },
    })
    .returning();
  if (!subscription) throw new Error("Push subscription upsert returned no row.");
  return subscription;
}

export async function disablePushSubscriptionByEndpoint(endpoint: string) {
  const now = new Date();
  const [subscription] = await db
    .update(blogPushSubscriptions)
    .set({ disabledAt: now, updatedAt: now })
    .where(eq(blogPushSubscriptions.endpoint, endpoint))
    .returning();
  return subscription ?? null;
}

export async function disablePushSubscriptionById(id: string) {
  const now = new Date();
  await db
    .update(blogPushSubscriptions)
    .set({ disabledAt: now, updatedAt: now })
    .where(eq(blogPushSubscriptions.id, id));
}

export async function findPushSubscriptionById(id: string) {
  const [subscription] = await db
    .select()
    .from(blogPushSubscriptions)
    .where(eq(blogPushSubscriptions.id, id))
    .limit(1);
  return subscription ?? null;
}

export async function findPushSubscriptionByEndpoint(endpoint: string) {
  const [subscription] = await db
    .select()
    .from(blogPushSubscriptions)
    .where(eq(blogPushSubscriptions.endpoint, endpoint))
    .limit(1);
  return subscription ?? null;
}

export async function upsertWebhookSubscription(options: {
  name: string;
  destinationType: WebhookDestinationTypeValue;
  urlHash: string;
  encryptedUrl: string;
  encryptedSecret: string | null;
}) {
  const now = new Date();
  const [subscription] = await db
    .insert(blogWebhookSubscriptions)
    .values({ ...options, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: blogWebhookSubscriptions.urlHash,
      set: {
        name: options.name,
        destinationType: options.destinationType,
        encryptedUrl: options.encryptedUrl,
        encryptedSecret: options.encryptedSecret,
        status: "active",
        disabledAt: null,
        updatedAt: now,
      },
    })
    .returning();
  if (!subscription) throw new Error("Webhook subscription upsert returned no row.");
  return subscription;
}

export async function disableWebhookSubscription(id: string) {
  const now = new Date();
  const [subscription] = await db
    .update(blogWebhookSubscriptions)
    .set({ status: "disabled", disabledAt: now, updatedAt: now })
    .where(eq(blogWebhookSubscriptions.id, id))
    .returning();
  return subscription ?? null;
}

export async function findWebhookSubscriptionById(id: string) {
  const [subscription] = await db
    .select()
    .from(blogWebhookSubscriptions)
    .where(eq(blogWebhookSubscriptions.id, id))
    .limit(1);
  return subscription ?? null;
}

export function listWebhookSubscriptionSummaries() {
  return db
    .select({
      id: blogWebhookSubscriptions.id,
      name: blogWebhookSubscriptions.name,
      destinationType: blogWebhookSubscriptions.destinationType,
      status: blogWebhookSubscriptions.status,
      createdAt: blogWebhookSubscriptions.createdAt,
      disabledAt: blogWebhookSubscriptions.disabledAt,
    })
    .from(blogWebhookSubscriptions)
    .orderBy(desc(blogWebhookSubscriptions.createdAt));
}

export async function createNotificationEvent(options: {
  eventKey: string;
  sourceId: string;
  sourceRevision: string;
  occurredAt: Date;
  payload: StoredBlogPublishedEvent;
}) {
  const [inserted] = await db
    .insert(notificationEvents)
    .values({ ...options, type: "blog.published" })
    .onConflictDoNothing({ target: notificationEvents.eventKey })
    .returning();
  if (inserted) return { created: true, event: inserted };

  const [event] = await db
    .select()
    .from(notificationEvents)
    .where(eq(notificationEvents.eventKey, options.eventKey))
    .limit(1);
  if (!event) throw new Error("Notification event conflict could not be resolved.");
  return { created: false, event };
}

export async function findNotificationEventById(id: string) {
  const [event] = await db
    .select()
    .from(notificationEvents)
    .where(eq(notificationEvents.id, id))
    .limit(1);
  return event ?? null;
}

export async function listActiveNotificationDestinationIds(
  channel: NotificationDeliveryChannelValue,
  options: { afterId?: string; createdBefore: Date; limit: number },
) {
  if (channel === "email") {
    return db
      .select({ id: blogEmailSubscriptions.id })
      .from(blogEmailSubscriptions)
      .where(
        and(
          eq(blogEmailSubscriptions.status, "active"),
          lte(blogEmailSubscriptions.verifiedAt, options.createdBefore),
          options.afterId ? gt(blogEmailSubscriptions.id, options.afterId) : undefined,
        ),
      )
      .orderBy(asc(blogEmailSubscriptions.id))
      .limit(options.limit);
  }
  if (channel === "push") {
    return db
      .select({ id: blogPushSubscriptions.id })
      .from(blogPushSubscriptions)
      .where(
        and(
          isNull(blogPushSubscriptions.disabledAt),
          lte(blogPushSubscriptions.createdAt, options.createdBefore),
          options.afterId ? gt(blogPushSubscriptions.id, options.afterId) : undefined,
        ),
      )
      .orderBy(asc(blogPushSubscriptions.id))
      .limit(options.limit);
  }
  return db
    .select({ id: blogWebhookSubscriptions.id })
    .from(blogWebhookSubscriptions)
    .where(
      and(
        eq(blogWebhookSubscriptions.status, "active"),
        lte(blogWebhookSubscriptions.createdAt, options.createdBefore),
        options.afterId ? gt(blogWebhookSubscriptions.id, options.afterId) : undefined,
      ),
    )
    .orderBy(asc(blogWebhookSubscriptions.id))
    .limit(options.limit);
}

export function listIncompleteNotificationEventMaterializations(limit: number) {
  return db
    .select({
      id: notificationEvents.id,
      createdAt: notificationEvents.createdAt,
      emailMaterializedAt: notificationEvents.emailMaterializedAt,
      pushMaterializedAt: notificationEvents.pushMaterializedAt,
      webhookMaterializedAt: notificationEvents.webhookMaterializedAt,
    })
    .from(notificationEvents)
    .where(
      or(
        isNull(notificationEvents.emailMaterializedAt),
        isNull(notificationEvents.pushMaterializedAt),
        isNull(notificationEvents.webhookMaterializedAt),
      ),
    )
    .orderBy(asc(notificationEvents.createdAt))
    .limit(limit);
}

export async function markNotificationEventChannelMaterialized(
  eventId: string,
  channel: NotificationDeliveryChannelValue,
) {
  const materializedAt = new Date();
  const values =
    channel === "email"
      ? { emailMaterializedAt: materializedAt }
      : channel === "push"
        ? { pushMaterializedAt: materializedAt }
        : { webhookMaterializedAt: materializedAt };
  await db.update(notificationEvents).set(values).where(eq(notificationEvents.id, eventId));
}

export async function createNotificationDeliveries(options: {
  eventId: string;
  channel: NotificationDeliveryChannelValue;
  destinationIds: string[];
}) {
  if (options.destinationIds.length === 0) return 0;
  const rows = await db
    .insert(notificationDeliveries)
    .values(
      options.destinationIds.map((destinationId) => ({
        eventId: options.eventId,
        channel: options.channel,
        destinationId,
      })),
    )
    .onConflictDoNothing({
      target: [
        notificationDeliveries.eventId,
        notificationDeliveries.channel,
        notificationDeliveries.destinationId,
      ],
    })
    .returning({ id: notificationDeliveries.id });
  return rows.length;
}

const readyDeliveryCondition = (now: Date, staleClaimBefore: Date) =>
  and(
    lt(notificationDeliveries.attemptCount, notificationDeliveries.maxAttempts),
    or(
      eq(notificationDeliveries.status, "pending"),
      and(
        eq(notificationDeliveries.status, "failed"),
        lte(notificationDeliveries.nextAttemptAt, now),
      ),
      and(
        eq(notificationDeliveries.status, "processing"),
        lte(notificationDeliveries.claimedAt, staleClaimBefore),
      ),
    ),
  );

export function listReadyNotificationDeliveries(options: {
  now: Date;
  staleClaimBefore: Date;
  eventId?: string;
  channel?: NotificationDeliveryChannelValue;
  limit: number;
}) {
  return db
    .select()
    .from(notificationDeliveries)
    .where(
      and(
        options.eventId ? eq(notificationDeliveries.eventId, options.eventId) : undefined,
        options.channel ? eq(notificationDeliveries.channel, options.channel) : undefined,
        readyDeliveryCondition(options.now, options.staleClaimBefore),
      ),
    )
    .orderBy(asc(notificationDeliveries.nextAttemptAt))
    .limit(options.limit);
}

export async function claimNotificationDelivery(options: {
  id: string;
  now: Date;
  staleClaimBefore: Date;
}) {
  const [delivery] = await db
    .update(notificationDeliveries)
    .set({
      status: "processing",
      attemptCount: sql`${notificationDeliveries.attemptCount} + 1`,
      claimedAt: options.now,
      lastAttemptedAt: options.now,
      updatedAt: options.now,
    })
    .where(
      and(
        eq(notificationDeliveries.id, options.id),
        readyDeliveryCondition(options.now, options.staleClaimBefore),
      ),
    )
    .returning();
  return delivery ?? null;
}

export async function completeNotificationDelivery(options: {
  id: string;
  httpStatus?: number;
  providerMessageId?: string;
}) {
  const now = new Date();
  await db
    .update(notificationDeliveries)
    .set({
      status: "delivered",
      deliveredAt: now,
      claimedAt: null,
      httpStatus: options.httpStatus,
      providerMessageId: options.providerMessageId,
      errorCode: null,
      updatedAt: now,
    })
    .where(eq(notificationDeliveries.id, options.id));
}

export async function failNotificationDelivery(options: {
  id: string;
  errorCode: string;
  httpStatus?: number;
  nextAttemptAt: Date;
}) {
  await db
    .update(notificationDeliveries)
    .set({
      status: "failed",
      claimedAt: null,
      httpStatus: options.httpStatus,
      errorCode: options.errorCode,
      nextAttemptAt: options.nextAttemptAt,
      updatedAt: new Date(),
    })
    .where(eq(notificationDeliveries.id, options.id));
}

export async function abandonNotificationDelivery(options: {
  id: string;
  errorCode: string;
  httpStatus?: number;
}) {
  await db
    .update(notificationDeliveries)
    .set({
      status: "failed",
      attemptCount: notificationDeliveries.maxAttempts,
      claimedAt: null,
      httpStatus: options.httpStatus,
      errorCode: options.errorCode,
      updatedAt: new Date(),
    })
    .where(eq(notificationDeliveries.id, options.id));
}

export async function consumeNotificationRateLimit(options: {
  scope: string;
  keyHash: string;
  limit: number;
  windowMs: number;
  now?: Date;
}) {
  const now = options.now ?? new Date();
  const windowStartedAt = new Date(Math.floor(now.getTime() / options.windowMs) * options.windowMs);
  const [counter] = await db
    .insert(notificationRateLimits)
    .values({ scope: options.scope, keyHash: options.keyHash, windowStartedAt, updatedAt: now })
    .onConflictDoUpdate({
      target: [
        notificationRateLimits.scope,
        notificationRateLimits.keyHash,
        notificationRateLimits.windowStartedAt,
      ],
      set: {
        count: sql`${notificationRateLimits.count} + 1`,
        updatedAt: now,
      },
    })
    .returning({ count: notificationRateLimits.count });
  return {
    allowed: Boolean(counter && counter.count <= options.limit),
    count: counter?.count ?? 0,
  };
}

export async function deleteExpiredNotificationRateLimits(olderThan: Date) {
  await db.delete(notificationRateLimits).where(lt(notificationRateLimits.updatedAt, olderThan));
}

export async function getNotificationAdminSummary() {
  const [emailRows, pushRows, webhookRows, latestEvents] = await Promise.all([
    db
      .select({ count: count() })
      .from(blogEmailSubscriptions)
      .where(eq(blogEmailSubscriptions.status, "active")),
    db
      .select({ count: count() })
      .from(blogPushSubscriptions)
      .where(isNull(blogPushSubscriptions.disabledAt)),
    db
      .select({ count: count() })
      .from(blogWebhookSubscriptions)
      .where(eq(blogWebhookSubscriptions.status, "active")),
    db.select().from(notificationEvents).orderBy(desc(notificationEvents.occurredAt)).limit(1),
  ]);
  const latestEvent = latestEvents[0] ?? null;
  const deliveries = latestEvent
    ? await db
        .select({
          channel: notificationDeliveries.channel,
          status: notificationDeliveries.status,
        })
        .from(notificationDeliveries)
        .where(eq(notificationDeliveries.eventId, latestEvent.id))
    : [];

  return {
    counts: {
      email: emailRows[0]?.count ?? 0,
      push: pushRows[0]?.count ?? 0,
      webhook: webhookRows[0]?.count ?? 0,
    },
    latestEvent,
    deliveries,
  };
}
