import type { StoredBlogPublishedEvent } from "@portfolio/database";
import { getNotificationsServerEnv } from "@portfolio/env/notifications-server";
import webPush, { WebPushError } from "web-push";

import { NotificationDeliveryError } from "./errors";

export function isWebPushConfigured() {
  const environment = getNotificationsServerEnv();
  return Boolean(
    environment.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY &&
    environment.WEB_PUSH_VAPID_PRIVATE_KEY &&
    environment.WEB_PUSH_SUBJECT,
  );
}

export function getWebPushPublicKey() {
  return getNotificationsServerEnv().NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY ?? null;
}

type PushDestination = { endpoint: string; p256dh: string; auth: string };

const PUSH_SERVICE_HOSTS = new Set([
  "fcm.googleapis.com",
  "push.services.mozilla.com",
  "updates.push.services.mozilla.com",
  "web.push.apple.com",
]);
const PUSH_SERVICE_HOST_SUFFIXES = [".notify.windows.com"];

export function isAllowedPushServiceEndpoint(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443")
  ) {
    return false;
  }
  const hostname = url.hostname.toLowerCase();
  return (
    PUSH_SERVICE_HOSTS.has(hostname) ||
    PUSH_SERVICE_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  );
}

export function validatePushServiceEndpoint(value: string) {
  if (!isAllowedPushServiceEndpoint(value)) {
    throw new NotificationDeliveryError("The endpoint is not a recognized Web Push service.", {
      code: "PUSH_INVALID_ENDPOINT",
      retryable: false,
    });
  }
}

async function sendPushNotification(options: {
  subscription: PushDestination;
  payload: string;
  topic: string;
}) {
  validatePushServiceEndpoint(options.subscription.endpoint);
  const environment = getNotificationsServerEnv();
  const publicKey = environment.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
  const privateKey = environment.WEB_PUSH_VAPID_PRIVATE_KEY;
  const subject = environment.WEB_PUSH_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new NotificationDeliveryError("Web Push delivery is not configured.", {
      code: "PUSH_NOT_CONFIGURED",
      retryable: false,
    });
  }
  try {
    const response = await webPush.sendNotification(
      {
        endpoint: options.subscription.endpoint,
        keys: { p256dh: options.subscription.p256dh, auth: options.subscription.auth },
      },
      options.payload,
      {
        TTL: 86_400,
        urgency: "normal",
        topic: options.topic,
        timeout: 10_000,
        vapidDetails: { subject, publicKey, privateKey },
      },
    );
    return response.statusCode;
  } catch (error) {
    if (error instanceof WebPushError) {
      const stale = error.statusCode === 404 || error.statusCode === 410;
      throw new NotificationDeliveryError("The push service rejected the subscription.", {
        cause: error,
        code: stale ? "PUSH_SUBSCRIPTION_STALE" : "PUSH_REJECTED",
        httpStatus: error.statusCode,
        retryable:
          !stale &&
          (error.statusCode === 408 || error.statusCode === 429 || error.statusCode >= 500),
        staleDestination: stale,
      });
    }
    throw new NotificationDeliveryError("The push service request failed.", {
      cause: error,
      code: "PUSH_NETWORK_ERROR",
    });
  }
}

export function sendBlogPublishedPush(options: {
  subscription: PushDestination;
  event: StoredBlogPublishedEvent;
}) {
  const blog = options.event.data.blog;
  return sendPushNotification({
    subscription: options.subscription,
    payload: JSON.stringify({
      title: "New blog published",
      body: blog.excerpt ? `${blog.title} — ${blog.excerpt}`.slice(0, 180) : blog.title,
      icon: "/web-app-manifest-192x192.png",
      badge: "/web-app-manifest-192x192.png",
      url: new URL(blog.url).pathname,
      tag: options.event.id,
    }),
    topic: options.event.id.replaceAll(/[^A-Za-z0-9_-]/g, "").slice(-32),
  });
}

export function sendPushTestNotification(subscription: PushDestination) {
  return sendPushNotification({
    subscription,
    payload: JSON.stringify({
      title: "Browser notifications are working",
      body: "This browser is connected to Zomer's new-blog notifications.",
      icon: "/web-app-manifest-192x192.png",
      badge: "/web-app-manifest-192x192.png",
      url: "/blogs",
      tag: "blog-push-test",
    }),
    topic: "blog-push-test",
  });
}
