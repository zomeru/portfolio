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

import { log, logError } from "../../lib/log";
import { createSecretToken, hashToken, keyedHash, parseUnsubscribeToken } from "./crypto";
import { isEmailConfigured, sendSubscriptionConfirmationEmail } from "./email";
import { NotificationDeliveryError } from "./errors";
import {
  getWebPushPublicKey,
  isWebPushConfigured,
  sendPushTestNotification,
  validatePushServiceEndpoint,
} from "./push";

type EmailSubscriptionResult = {
  subscription: { id: string };
  outcome: "confirmation_required" | "confirmation_pending" | "already_subscribed" | "suppressed";
};

type EmailSubscriptionDependencies = {
  getConfiguration: () => {
    confirmationTtlHours: number;
    emailConfigured: boolean;
    siteUrl: string;
  };
  createToken: () => string;
  hashToken: (token: string) => string;
  createOrReuse: (options: {
    email: string;
    verificationTokenHash: string;
    verificationExpiresAt: Date;
  }) => Promise<EmailSubscriptionResult>;
  confirm: (tokenHash: string, now: Date) => Promise<{ id: string } | null>;
  expireToken: (subscriptionId: string, tokenHash: string) => Promise<void>;
  sendConfirmation: (options: {
    email: string;
    confirmationUrl: string;
    expiresInHours: number;
    subscriptionId: string;
    tokenHash: string;
  }) => Promise<unknown>;
  now: () => Date;
};

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

export function createEmailSubscriptionService(dependencies: EmailSubscriptionDependencies) {
  return {
    async subscribe(email: string) {
      const configuration = dependencies.getConfiguration();
      if (!configuration.emailConfigured) {
        throw new NotificationDeliveryError("Email subscriptions are not configured.", {
          code: "EMAIL_NOT_CONFIGURED",
          retryable: false,
        });
      }

      const now = dependencies.now();
      const token = dependencies.createToken();
      const tokenHash = dependencies.hashToken(token);
      const result = await dependencies.createOrReuse({
        email,
        verificationTokenHash: tokenHash,
        verificationExpiresAt: new Date(
          now.getTime() + configuration.confirmationTtlHours * 60 * 60 * 1_000,
        ),
      });
      if (result.outcome !== "confirmation_required") return { outcome: result.outcome };

      const confirmationUrl = new URL("/api/notifications/email/confirm", configuration.siteUrl);
      confirmationUrl.searchParams.set("token", token);
      try {
        await dependencies.sendConfirmation({
          email,
          confirmationUrl: confirmationUrl.href,
          expiresInHours: configuration.confirmationTtlHours,
          subscriptionId: result.subscription.id,
          tokenHash,
        });
      } catch (error) {
        try {
          await dependencies.expireToken(result.subscription.id, tokenHash);
        } catch (cleanupError) {
          log("error", "failed email confirmation token could not be expired", {
            operation: "notifications.expireFailedEmailConfirmation",
            subscriptionId: result.subscription.id,
            errorType: cleanupError instanceof Error ? cleanupError.name : "NonErrorThrown",
          });
        }
        throw error;
      }
      return { outcome: result.outcome };
    },

    confirm(token: string) {
      return dependencies.confirm(dependencies.hashToken(token), dependencies.now());
    },
  };
}

const emailSubscriptionService = createEmailSubscriptionService({
  getConfiguration: () => {
    const environment = getNotificationsServerEnv();
    return {
      confirmationTtlHours: environment.EMAIL_CONFIRMATION_TTL_HOURS,
      emailConfigured: isEmailConfigured(),
      siteUrl: getSiteEnv().siteUrl,
    };
  },
  createToken: () => createSecretToken(32),
  hashToken,
  createOrReuse: createOrReuseEmailSubscription,
  confirm: confirmEmailSubscription,
  expireToken: expireEmailVerificationToken,
  sendConfirmation: sendSubscriptionConfirmationEmail,
  now: () => new Date(),
});

export function subscribeEmailAddress(email: string) {
  return emailSubscriptionService.subscribe(email);
}

export function confirmEmailAddress(token: string) {
  return emailSubscriptionService.confirm(token);
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
