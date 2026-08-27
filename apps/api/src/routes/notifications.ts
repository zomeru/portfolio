import {
  disableWebhookSubscription,
  findWebhookSubscriptionById,
  getNotificationAdminSummary,
  listWebhookSubscriptionSummaries,
} from "@portfolio/database";
import { getSiteEnv } from "@portfolio/env/site";
import { type Context, Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";

import { verifyAdminSessionToken } from "../lib/admin-session";
import { requireCronAuthorization } from "../lib/auth";
import { log, logError, logWarning } from "../lib/log";
import { retryNotificationDeliveries } from "../services/notifications/delivery";
import {
  validateEmailAddress,
  validateEmailFormat,
} from "../services/notifications/email-validation";
import { NotificationDeliveryError } from "../services/notifications/errors";
import {
  confirmEmailAddress,
  enforceNotificationRateLimit,
  getPushSubscriptionConfig,
  NotificationRateLimitError,
  subscribeEmailAddress,
  subscribePushDevice,
  testPushDevice,
  unsubscribeEmailAddress,
  unsubscribePushDevice,
} from "../services/notifications/subscriptions";
import { registerWebhookSubscription, sendWebhookTest } from "../services/notifications/webhook";
import type { ApiEnv } from "../types/hono";

const emailInputSchema = z.object({
  email: z.string().max(1_024),
});
const tokenSchema = z.string().min(32).max(256);
const pushSubscriptionSchema = z.object({
  endpoint: z
    .url()
    .max(2_048)
    .refine((value) => value.startsWith("https://")),
  keys: z.object({
    p256dh: z
      .string()
      .min(40)
      .max(1_024)
      .regex(/^[A-Za-z0-9_-]+$/),
    auth: z
      .string()
      .min(16)
      .max(512)
      .regex(/^[A-Za-z0-9_-]+$/),
  }),
});
const pushUnsubscribeSchema = z.object({
  endpoint: z
    .url()
    .max(2_048)
    .refine((value) => value.startsWith("https://")),
});
const webhookRegistrationSchema = z.object({
  name: z.string().trim().min(1).max(100),
  url: z.url().max(2_048),
  destinationType: z.enum(["generic", "slack", "discord"]).default("generic"),
  events: z.array(z.literal("blog.published")).min(1).max(1),
});
const mutationBodyLimit = bodyLimit({
  maxSize: 16 * 1_024,
  onError: (c) =>
    c.json(
      {
        error: { code: "PAYLOAD_TOO_LARGE", message: "The request body is too large." },
        requestId: c.get("requestId"),
      },
      413,
    ),
});

function requestFingerprint(headers: Headers) {
  return (
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

function requireNotificationAdmin(authorization: string | undefined) {
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;
  if (verifyAdminSessionToken(token, "blog-generation")) return;
  requireCronAuthorization(authorization);
}

function logEmailFailure(message: string, error: unknown, operation: string) {
  log("error", message, {
    operation,
    errorType: error instanceof Error ? error.name : "NonErrorThrown",
    ...(error instanceof NotificationDeliveryError
      ? { notificationErrorCode: error.code, retryable: error.retryable }
      : {}),
  });
}

function errorResponse(c: Context<ApiEnv>, error: unknown, operation: string) {
  if (error instanceof NotificationRateLimitError) {
    logWarning("notification request rate limited", error, { operation });
    c.header("Retry-After", "3600");
    return c.json(
      { error: { code: "RATE_LIMITED", message: error.message }, requestId: c.get("requestId") },
      429,
    );
  }
  if (error instanceof NotificationDeliveryError) {
    const invalidWebhook = new Set([
      "WEBHOOK_INVALID_DISCORD_HOST",
      "WEBHOOK_INVALID_SLACK_HOST",
      "WEBHOOK_INVALID_URL",
      "WEBHOOK_PRIVATE_ADDRESS",
      "WEBHOOK_UNSAFE_URL",
    ]).has(error.code);
    const invalidDestination = invalidWebhook || error.code === "PUSH_INVALID_ENDPOINT";
    const status =
      error.code === "PUSH_SUBSCRIPTION_STALE"
        ? 410
        : invalidDestination
          ? 400
          : error.retryable
            ? 502
            : 503;
    const logFailure = status >= 500 ? logError : logWarning;
    logFailure("notification request failed", error, {
      operation,
      notificationErrorCode: error.code,
      status,
      retryable: error.retryable,
      ...(error.httpStatus ? { providerStatus: error.httpStatus } : {}),
    });
    return c.json(
      { error: { code: error.code, message: error.message }, requestId: c.get("requestId") },
      status,
    );
  }
  throw error;
}

export const notificationRoutes = new Hono<ApiEnv>()
  .use("*", async (c, next) => {
    await next();
    c.header("Cache-Control", "no-store");
  })
  .use("/email/*", mutationBodyLimit)
  .use("/push/*", mutationBodyLimit)
  .use("/webhooks/*", mutationBodyLimit)
  .post("/email/subscribe", async (c) => {
    const parsed = emailInputSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json(
        {
          error: { code: "INVALID_EMAIL", message: "Enter a valid email address." },
          requestId: c.get("requestId"),
        },
        400,
      );
    }
    const accepted = () =>
      c.json({ success: true as const, status: "confirmation_sent" as const }, 202);
    const format = validateEmailFormat(parsed.data.email);
    if (!format.success) {
      return c.json(
        {
          error: { code: "INVALID_EMAIL", message: "Enter a valid email address." },
          requestId: c.get("requestId"),
        },
        400,
      );
    }
    try {
      const fingerprint = requestFingerprint(c.req.raw.headers);
      await enforceNotificationRateLimit({
        scope: "email-subscribe-ip",
        key: fingerprint,
        limit: 5,
        windowMs: 60 * 60 * 1_000,
      });

      const validation = await validateEmailAddress(format.email);
      if (!validation.success) {
        if (validation.retryable) {
          logWarning("email MX validation lookup failed", new Error("DNS lookup failed."), {
            operation: "notifications.validateEmail",
          });
          return c.json(
            {
              error: {
                code: "EMAIL_VALIDATION_UNAVAILABLE",
                message: "Email validation is temporarily unavailable. Try again shortly.",
              },
              requestId: c.get("requestId"),
            },
            503,
          );
        }
        return c.json(
          {
            error: { code: "INVALID_EMAIL", message: "Enter a valid email address." },
            requestId: c.get("requestId"),
          },
          400,
        );
      }

      await enforceNotificationRateLimit({
        scope: "email-subscribe-address",
        key: validation.email,
        limit: 3,
        windowMs: 60 * 60 * 1_000,
      });
      try {
        await subscribeEmailAddress(validation.email);
      } catch (error) {
        logEmailFailure("email subscription request failed", error, "notifications.subscribeEmail");
      }
      return accepted();
    } catch (error) {
      return errorResponse(c, error, "notifications.subscribeEmail");
    }
  })
  .get("/email/confirm", async (c) => {
    const token = tokenSchema.safeParse(c.req.query("token"));
    const redirectUrl = new URL("/blogs", getSiteEnv().siteUrl);
    try {
      await enforceNotificationRateLimit({
        scope: "email-confirm-ip",
        key: requestFingerprint(c.req.raw.headers),
        limit: 30,
        windowMs: 60 * 60 * 1_000,
      });
      if (token.success) {
        await enforceNotificationRateLimit({
          scope: "email-confirm-token",
          key: token.data,
          limit: 10,
          windowMs: 60 * 60 * 1_000,
        });
      }
      const confirmed = token.success ? await confirmEmailAddress(token.data) : null;
      redirectUrl.searchParams.set("subscription", confirmed ? "confirmed" : "invalid");
    } catch (error) {
      if (error instanceof NotificationRateLimitError) {
        return errorResponse(c, error, "notifications.confirmEmail");
      }
      logEmailFailure("email confirmation failed", error, "notifications.confirmEmail");
      redirectUrl.searchParams.set("subscription", "invalid");
    }
    return c.redirect(redirectUrl.href, 303);
  })
  .post("/email/unsubscribe", async (c) => {
    const token = tokenSchema.safeParse(c.req.query("token"));
    if (!token.success) {
      return c.json(
        {
          error: { code: "INVALID_TOKEN", message: "This unsubscribe link is invalid." },
          requestId: c.get("requestId"),
        },
        400,
      );
    }
    const subscription = await unsubscribeEmailAddress(token.data);
    if (!subscription) {
      return c.json(
        {
          error: { code: "INVALID_TOKEN", message: "This unsubscribe link is invalid." },
          requestId: c.get("requestId"),
        },
        400,
      );
    }
    return c.json({ success: true as const, status: "unsubscribed" as const });
  })
  .get("/push/config", (c) => c.json(getPushSubscriptionConfig()))
  .post("/push/subscribe", async (c) => {
    const parsed = pushSubscriptionSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "INVALID_PUSH_SUBSCRIPTION",
            message: "The push subscription is invalid.",
          },
          requestId: c.get("requestId"),
        },
        400,
      );
    }
    try {
      await enforceNotificationRateLimit({
        scope: "push-subscribe-ip",
        key: requestFingerprint(c.req.raw.headers),
        limit: 10,
        windowMs: 60 * 60 * 1_000,
      });
      await subscribePushDevice(parsed.data);
      return c.json({ success: true as const, status: "subscribed" as const });
    } catch (error) {
      return errorResponse(c, error, "notifications.subscribePush");
    }
  })
  .post("/push/test", async (c) => {
    if (getSiteEnv().nodeEnv !== "development") {
      requireNotificationAdmin(c.req.header("Authorization"));
    }
    const parsed = pushUnsubscribeSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "INVALID_PUSH_SUBSCRIPTION",
            message: "The push subscription is invalid.",
          },
          requestId: c.get("requestId"),
        },
        400,
      );
    }
    try {
      await enforceNotificationRateLimit({
        scope: "push-test-ip",
        key: requestFingerprint(c.req.raw.headers),
        limit: 3,
        windowMs: 60 * 60 * 1_000,
      });
      const result = await testPushDevice(parsed.data.endpoint);
      return result
        ? c.json({ success: true as const, status: "sent" as const })
        : c.json(
            {
              error: {
                code: "PUSH_SUBSCRIPTION_NOT_FOUND",
                message: "This browser subscription is not active on the server.",
              },
              requestId: c.get("requestId"),
            },
            404,
          );
    } catch (error) {
      return errorResponse(c, error, "notifications.testPush");
    }
  })
  .delete("/push/unsubscribe", async (c) => {
    const parsed = pushUnsubscribeSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "INVALID_PUSH_SUBSCRIPTION",
            message: "The push subscription is invalid.",
          },
          requestId: c.get("requestId"),
        },
        400,
      );
    }
    await unsubscribePushDevice(parsed.data.endpoint);
    return c.json({ success: true as const, status: "unsubscribed" as const });
  })
  .get("/admin/summary", async (c) => {
    requireNotificationAdmin(c.req.header("Authorization"));
    return c.json(await getNotificationAdminSummary());
  })
  .get("/webhooks", async (c) => {
    requireNotificationAdmin(c.req.header("Authorization"));
    return c.json({ webhooks: await listWebhookSubscriptionSummaries() });
  })
  .post("/webhooks", async (c) => {
    requireNotificationAdmin(c.req.header("Authorization"));
    const parsed = webhookRegistrationSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json(
        {
          error: { code: "INVALID_WEBHOOK", message: "The webhook registration is invalid." },
          requestId: c.get("requestId"),
        },
        400,
      );
    }
    try {
      const webhook = await registerWebhookSubscription(parsed.data);
      return c.json({ success: true as const, webhook }, 201);
    } catch (error) {
      return errorResponse(c, error, "notifications.registerWebhook");
    }
  })
  .post("/webhooks/:id/test", async (c) => {
    requireNotificationAdmin(c.req.header("Authorization"));
    const id = z.uuid().safeParse(c.req.param("id"));
    if (!id.success) {
      return c.json(
        {
          error: { code: "INVALID_WEBHOOK_ID", message: "The webhook identifier is invalid." },
          requestId: c.get("requestId"),
        },
        400,
      );
    }
    const subscription = await findWebhookSubscriptionById(id.data);
    if (subscription?.status !== "active") {
      return c.json(
        {
          error: { code: "WEBHOOK_NOT_FOUND", message: "The active webhook was not found." },
          requestId: c.get("requestId"),
        },
        404,
      );
    }
    try {
      const httpStatus = await sendWebhookTest({ subscription, siteUrl: getSiteEnv().siteUrl });
      log("info", "webhook test delivered", {
        operation: "notifications.testWebhook",
        webhookId: subscription.id,
        destinationType: subscription.destinationType,
        providerStatus: httpStatus,
      });
      return c.json({ success: true as const, status: "sent" as const });
    } catch (error) {
      return errorResponse(c, error, "notifications.testWebhook");
    }
  })
  .delete("/webhooks/:id", async (c) => {
    requireNotificationAdmin(c.req.header("Authorization"));
    const id = z.uuid().safeParse(c.req.param("id"));
    if (!id.success) {
      return c.json(
        {
          error: { code: "INVALID_WEBHOOK_ID", message: "The webhook identifier is invalid." },
          requestId: c.get("requestId"),
        },
        400,
      );
    }
    const webhook = await disableWebhookSubscription(id.data);
    return webhook
      ? c.json({ success: true as const })
      : c.json(
          {
            error: { code: "WEBHOOK_NOT_FOUND", message: "The webhook was not found." },
            requestId: c.get("requestId"),
          },
          404,
        );
  })
  .post("/retry", async (c) => {
    requireNotificationAdmin(c.req.header("Authorization"));
    return c.json({ success: true as const, deliveries: await retryNotificationDeliveries() });
  });
