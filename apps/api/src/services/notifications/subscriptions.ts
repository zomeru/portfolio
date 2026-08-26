import {
  confirmEmailSubscription,
  consumeNotificationRateLimit,
  createOrReuseEmailSubscription,
  disablePushSubscriptionByEndpoint,
  expireEmailVerificationToken,
  findPushSubscriptionByEndpoint,
  unsubscribeEmailSubscription,
  upsertPushSubscription,
} from "@portfolio/database";
import { getNotificationsServerEnv } from "@portfolio/env/notifications-server";
import { getSiteEnv } from "@portfolio/env/site";
import { z } from "zod";
import { logError } from "../../lib/log";
import { createSecretToken, hashToken, keyedHash, parseUnsubscribeToken } from "./crypto";
import { isEmailConfigured, sendSubscriptionConfirmationEmail } from "./email";
import { NotificationDeliveryError } from "./errors";
import {
  getWebPushPublicKey,
  isWebPushConfigured,
  sendPushTestNotification,
  validatePushServiceEndpoint,
} from "./push";

const CONFIRMATION_TTL_MS = 24 * 60 * 60 * 1_000;

export class NotificationRateLimitError extends Error {
  constructor() {
    super("Too many subscription requests. Try again later.");
    this.name = "NotificationRateLimitError";
  }
}

export async function enforceNotificationRateLimit(options: {
  scope: string;
  key: string;
  limit: number;
  windowMs: number;
}) {
  if (process.env.NODE_ENV === "development") return;

  if (!getNotificationsServerEnv().NOTIFICATION_TOKEN_SECRET) {
    throw new NotificationDeliveryError("Notifications are not configured.", {
      code: "NOTIFICATIONS_NOT_CONFIGURED",
      retryable: false,
    });
  }
  const result = await consumeNotificationRateLimit({
    ...options,
    keyHash: keyedHash(`rate-limit:${options.scope}:${options.key}`),
  });
  if (!result.allowed) throw new NotificationRateLimitError();
}

export async function subscribeEmailAddress(email: string) {
  if (!isEmailConfigured()) {
    throw new NotificationDeliveryError("Email subscriptions are not configured.", {
      code: "EMAIL_NOT_CONFIGURED",
      retryable: false,
    });
  }
  const token = createSecretToken(32);
  const tokenHash = hashToken(token);
  const result = await createOrReuseEmailSubscription({
    email,
    verificationTokenHash: tokenHash,
    verificationExpiresAt: new Date(Date.now() + CONFIRMATION_TTL_MS),
  });
  if (result.outcome !== "confirmation_required") return { outcome: result.outcome };

  const confirmationUrl = new URL("/api/notifications/email/confirm", getSiteEnv().siteUrl);
  confirmationUrl.searchParams.set("token", token);
  try {
    await sendSubscriptionConfirmationEmail({
      email,
      confirmationUrl: confirmationUrl.href,
      subscriptionId: result.subscription.id,
      tokenHash,
    });
  } catch (error) {
    try {
      await expireEmailVerificationToken(result.subscription.id, tokenHash);
    } catch (cleanupError) {
      logError("failed email confirmation token could not be expired", cleanupError, {
        operation: "notifications.expireFailedEmailConfirmation",
        subscriptionId: result.subscription.id,
      });
    }
    throw error;
  }
  return { outcome: result.outcome };
}

export function confirmEmailAddress(token: string) {
  return confirmEmailSubscription(hashToken(token));
}

export async function unsubscribeEmailAddress(token: string) {
  const parsed = parseUnsubscribeToken(token);
  if (!parsed || !z.uuid().safeParse(parsed.subscriptionId).success) return null;
  return unsubscribeEmailSubscription(parsed.subscriptionId, parsed.version);
}

export function getPushSubscriptionConfig() {
  return { enabled: isWebPushConfigured(), publicKey: getWebPushPublicKey() };
}

export async function subscribePushDevice(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  validatePushServiceEndpoint(subscription.endpoint);
  if (!isWebPushConfigured()) {
    throw new NotificationDeliveryError("Web Push subscriptions are not configured.", {
      code: "PUSH_NOT_CONFIGURED",
      retryable: false,
    });
  }
  return upsertPushSubscription({
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  });
}

export async function unsubscribePushDevice(endpoint: string) {
  if (!isWebPushConfigured()) return null;
  return disablePushSubscriptionByEndpoint(endpoint);
}

export async function testPushDevice(endpoint: string) {
  if (!isWebPushConfigured()) {
    throw new NotificationDeliveryError("Web Push subscriptions are not configured.", {
      code: "PUSH_NOT_CONFIGURED",
      retryable: false,
    });
  }
  const subscription = await findPushSubscriptionByEndpoint(endpoint);
  if (!subscription || subscription.disabledAt) return null;
  try {
    const httpStatus = await sendPushTestNotification(subscription);
    return { httpStatus };
  } catch (error) {
    if (error instanceof NotificationDeliveryError && error.staleDestination) {
      try {
        await disablePushSubscriptionByEndpoint(endpoint);
      } catch (cleanupError) {
        logError("stale push test subscription could not be disabled", cleanupError, {
          operation: "notifications.disableFailedPushTestSubscription",
        });
      }
    }
    throw error;
  }
}
