import {
  abandonNotificationDelivery,
  claimNotificationDelivery,
  completeNotificationDelivery,
  createNotificationDeliveries,
  createNotificationEvent,
  deleteExpiredNotificationRateLimits,
  disablePushSubscriptionById,
  failNotificationDelivery,
  findEmailSubscriptionById,
  findNotificationEventById,
  findPushSubscriptionById,
  findWebhookSubscriptionById,
  listActiveNotificationDestinationIds,
  listIncompleteNotificationEventMaterializations,
  listReadyNotificationDeliveries,
  markNotificationEventChannelMaterialized,
  type NotificationDeliveryChannelValue,
  type StoredBlogPublishedEvent,
} from "@portfolio/database";
import { getSiteEnv } from "@portfolio/env/site";
import { errorLogMetadata, log, logError, logWarning } from "../../lib/log";
import { createUnsubscribeToken, hashToken } from "./crypto";
import { sendBlogPublishedEmail } from "./email";
import { NotificationDeliveryError } from "./errors";
import { sendBlogPublishedPush } from "./push";
import { sendBlogPublishedWebhook } from "./webhook";

const DESTINATION_PAGE_SIZE = 100;
const MAX_IMMEDIATE_DELIVERIES = 100;
const DELIVERY_CONCURRENCY = 5;
const CLAIM_LEASE_MS = 10 * 60 * 1_000;
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 12 * 60 * 60_000];

export type BlogPublishedInput = {
  id: string;
  revision: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt: string;
};

export function createBlogPublishedEvent(
  blog: BlogPublishedInput,
  siteUrl: string,
  now = new Date(),
) {
  const eventKey = hashToken(`blog.published:${blog.id}:${blog.revision}`);
  const payload: StoredBlogPublishedEvent = {
    id: `evt_${eventKey.slice(0, 32)}`,
    type: "blog.published",
    apiVersion: "1",
    createdAt: now.toISOString(),
    data: {
      blog: {
        ...blog,
        url: new URL(`/blogs/${blog.slug}`, siteUrl).href,
      },
    },
  };
  return { eventKey, payload };
}

type DeliveryResult = {
  channel: NotificationDeliveryChannelValue;
  status: "delivered" | "failed" | "skipped";
  staleDestinationRemoved: boolean;
};

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  operation: (value: T) => Promise<R>,
) {
  const results: R[] = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await operation(values[index] as T);
    }
  });
  await Promise.all(workers);
  return results;
}

async function materializeDeliveries(
  eventId: string,
  channel: NotificationDeliveryChannelValue,
  createdBefore: Date,
) {
  let afterId: string | undefined;
  let created = 0;
  do {
    const destinations = await listActiveNotificationDestinationIds(channel, {
      ...(afterId ? { afterId } : {}),
      createdBefore,
      limit: DESTINATION_PAGE_SIZE,
    });
    created += await createNotificationDeliveries({
      eventId,
      channel,
      destinationIds: destinations.map((destination) => destination.id),
    });
    afterId = destinations.at(-1)?.id;
    if (destinations.length < DESTINATION_PAGE_SIZE) break;
  } while (afterId);
  await markNotificationEventChannelMaterialized(eventId, channel);
  return created;
}

async function recoverIncompleteMaterializations() {
  const events = await listIncompleteNotificationEventMaterializations(100);
  const recovered: Partial<Record<NotificationDeliveryChannelValue, number>> = {};
  for (const event of events) {
    for (const channel of ["email", "push", "webhook"] as const) {
      const materializedAt = event[`${channel}MaterializedAt`];
      if (materializedAt) continue;
      const created = await materializeDeliveries(event.id, channel, event.createdAt);
      recovered[channel] = (recovered[channel] ?? 0) + created;
    }
  }
  return { events: events.length, deliveries: recovered };
}

async function deliverClaimedNotification(
  delivery: NonNullable<Awaited<ReturnType<typeof claimNotificationDelivery>>>,
) {
  const event = await findNotificationEventById(delivery.eventId);
  if (!event) {
    throw new NotificationDeliveryError("Notification event no longer exists.", {
      code: "EVENT_NOT_FOUND",
      retryable: false,
    });
  }
  if (delivery.channel === "email") {
    const subscription = await findEmailSubscriptionById(delivery.destinationId);
    if (subscription?.status !== "active") return { skipped: true } as const;
    const token = createUnsubscribeToken(subscription.id, subscription.unsubscribeTokenVersion);
    const unsubscribeUrl = new URL("/blogs/unsubscribe", getSiteEnv().siteUrl);
    unsubscribeUrl.searchParams.set("token", token);
    const oneClickUnsubscribeUrl = new URL(
      "/api/notifications/email/unsubscribe",
      getSiteEnv().siteUrl,
    );
    oneClickUnsubscribeUrl.searchParams.set("token", token);
    const providerMessageId = await sendBlogPublishedEmail({
      deliveryId: delivery.id,
      email: subscription.email,
      event: event.payload,
      unsubscribeUrl: unsubscribeUrl.href,
      oneClickUnsubscribeUrl: oneClickUnsubscribeUrl.href,
    });
    return { providerMessageId } as const;
  }
  if (delivery.channel === "push") {
    const subscription = await findPushSubscriptionById(delivery.destinationId);
    if (!subscription || subscription.disabledAt) return { skipped: true } as const;
    const httpStatus = await sendBlogPublishedPush({ subscription, event: event.payload });
    return { httpStatus } as const;
  }
  const subscription = await findWebhookSubscriptionById(delivery.destinationId);
  if (subscription?.status !== "active") return { skipped: true } as const;
  const httpStatus = await sendBlogPublishedWebhook({
    deliveryId: delivery.id,
    subscription,
    event: event.payload,
  });
  return { httpStatus } as const;
}

async function processOneDelivery(candidate: {
  id: string;
  channel: NotificationDeliveryChannelValue;
}): Promise<DeliveryResult> {
  const now = new Date();
  const delivery = await claimNotificationDelivery({
    id: candidate.id,
    now,
    staleClaimBefore: new Date(now.getTime() - CLAIM_LEASE_MS),
  });
  if (!delivery) {
    return { channel: candidate.channel, status: "skipped", staleDestinationRemoved: false };
  }
  try {
    const result = await deliverClaimedNotification(delivery);
    if ("skipped" in result) {
      await abandonNotificationDelivery({ id: delivery.id, errorCode: "DESTINATION_INACTIVE" });
      return { channel: delivery.channel, status: "skipped", staleDestinationRemoved: false };
    }
    await completeNotificationDelivery({ id: delivery.id, ...result });
    return { channel: delivery.channel, status: "delivered", staleDestinationRemoved: false };
  } catch (error) {
    const deliveryError =
      error instanceof NotificationDeliveryError
        ? error
        : new NotificationDeliveryError("Notification delivery failed unexpectedly.", {
            cause: error,
            code: error instanceof Error ? error.name.toUpperCase() : "UNKNOWN_ERROR",
          });
    const exhausted = delivery.attemptCount >= delivery.maxAttempts;
    const logDeliveryFailure = deliveryError.staleDestination ? logWarning : logError;
    logDeliveryFailure(
      deliveryError.staleDestination
        ? "stale notification destination removed"
        : "notification delivery failed",
      deliveryError,
      {
        operation: "notifications.deliver",
        deliveryId: delivery.id,
        eventId: delivery.eventId,
        channel: delivery.channel,
        attempt: delivery.attemptCount,
        maxAttempts: delivery.maxAttempts,
        deliveryErrorCode: deliveryError.code,
        retryable: deliveryError.retryable,
        exhausted,
        staleDestinationRemoved: deliveryError.staleDestination,
        ...(deliveryError.httpStatus ? { providerStatus: deliveryError.httpStatus } : {}),
      },
    );
    if (deliveryError.staleDestination && delivery.channel === "push") {
      try {
        await disablePushSubscriptionById(delivery.destinationId);
      } catch (cleanupError) {
        logError("stale push subscription could not be disabled", cleanupError, {
          operation: "notifications.disableStalePushSubscription",
          deliveryId: delivery.id,
          eventId: delivery.eventId,
          destinationId: delivery.destinationId,
        });
      }
    }
    try {
      if (!deliveryError.retryable || exhausted || deliveryError.staleDestination) {
        await abandonNotificationDelivery({
          id: delivery.id,
          errorCode: deliveryError.code,
          ...(deliveryError.httpStatus ? { httpStatus: deliveryError.httpStatus } : {}),
        });
      } else {
        const delay =
          RETRY_DELAYS_MS[Math.min(delivery.attemptCount - 1, RETRY_DELAYS_MS.length - 1)] ??
          60_000;
        await failNotificationDelivery({
          id: delivery.id,
          errorCode: deliveryError.code,
          ...(deliveryError.httpStatus ? { httpStatus: deliveryError.httpStatus } : {}),
          nextAttemptAt: new Date(Date.now() + delay),
        });
      }
    } catch (persistenceError) {
      logError("notification failure status could not be persisted", persistenceError, {
        operation: "notifications.recordDeliveryFailure",
        deliveryId: delivery.id,
        eventId: delivery.eventId,
        channel: delivery.channel,
        deliveryErrorCode: deliveryError.code,
      });
      throw persistenceError;
    }
    return {
      channel: delivery.channel,
      status: "failed",
      staleDestinationRemoved: deliveryError.staleDestination,
    };
  }
}

async function processNotificationDeliveries(
  options: { eventId?: string; channel?: NotificationDeliveryChannelValue; limit?: number } = {},
) {
  const now = new Date();
  const deliveries = await listReadyNotificationDeliveries({
    now,
    staleClaimBefore: new Date(now.getTime() - CLAIM_LEASE_MS),
    ...(options.eventId ? { eventId: options.eventId } : {}),
    ...(options.channel ? { channel: options.channel } : {}),
    limit: options.limit ?? MAX_IMMEDIATE_DELIVERIES,
  });
  const results = await mapWithConcurrency(
    deliveries.map((delivery) => ({ id: delivery.id, channel: delivery.channel })),
    DELIVERY_CONCURRENCY,
    processOneDelivery,
  );
  const summary = Object.fromEntries(
    (["email", "push", "webhook"] as const).map((channel) => {
      const channelResults = results.filter((result) => result.channel === channel);
      return [
        channel,
        {
          attempted: channelResults.length,
          succeeded: channelResults.filter((result) => result.status === "delivered").length,
          failed: channelResults.filter((result) => result.status === "failed").length,
          skipped: channelResults.filter((result) => result.status === "skipped").length,
          staleSubscriptionsRemoved: channelResults.filter(
            (result) => result.staleDestinationRemoved,
          ).length,
        },
      ];
    }),
  );
  return summary as Record<
    NotificationDeliveryChannelValue,
    {
      attempted: number;
      succeeded: number;
      failed: number;
      skipped: number;
      staleSubscriptionsRemoved: number;
    }
  >;
}

export async function dispatchBlogPublished(blog: BlogPublishedInput) {
  const siteUrl = getSiteEnv().siteUrl;
  const { eventKey, payload } = createBlogPublishedEvent(blog, siteUrl);
  const eventId = payload.id;
  const persisted = await createNotificationEvent({
    eventKey,
    sourceId: blog.id,
    sourceRevision: blog.revision,
    occurredAt: new Date(blog.publishedAt),
    payload,
  });
  const materialized: Partial<Record<NotificationDeliveryChannelValue, number>> = {};
  const materializationFailures: NotificationDeliveryChannelValue[] = [];
  for (const channel of ["email", "push", "webhook"] as const) {
    try {
      materialized[channel] = await materializeDeliveries(
        persisted.event.id,
        channel,
        persisted.event.createdAt,
      );
    } catch (error) {
      materializationFailures.push(channel);
      log("error", "notification delivery materialization failed", {
        eventId,
        blogId: blog.id,
        channel,
        ...errorLogMetadata(error, "notifications.materializeDeliveries"),
      });
    }
  }
  const deliveries = await processNotificationDeliveries({ eventId: persisted.event.id });
  log("info", "blog.published dispatched", {
    eventId,
    blogId: blog.id,
    eventCreated: persisted.created,
    materialized,
    deliveries,
  });
  return {
    eventId,
    eventCreated: persisted.created,
    materialized,
    materializationFailures,
    deliveries,
  };
}

export async function retryNotificationDeliveries(options?: {
  channel?: NotificationDeliveryChannelValue;
}) {
  const recovered = await recoverIncompleteMaterializations();
  const summary = await processNotificationDeliveries({ ...options, limit: 200 });
  await deleteExpiredNotificationRateLimits(new Date(Date.now() - 7 * 24 * 60 * 60 * 1_000));
  log("info", "notification delivery retry completed", { recovered, deliveries: summary });
  return summary;
}
