import type { StoredBlogPublishedEvent } from "@portfolio/database";
import { getNotificationsServerEnv } from "@portfolio/env/notifications-server";
import { generateRequestDetails } from "web-push";

import { NotificationDeliveryError } from "./errors";

export function isWebPushConfigured() {
  const environment = getNotificationsServerEnv();
  return Boolean(
    environment.webPushVapidPublicKey &&
    environment.webPushVapidPrivateKey &&
    environment.webPushSubject,
  );
}

export function getWebPushPublicKey() {
  return getNotificationsServerEnv().webPushVapidPublicKey ?? null;
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
  const publicKey = environment.webPushVapidPublicKey;
  const privateKey = environment.webPushVapidPrivateKey;
  const subject = environment.webPushSubject;
  if (!publicKey || !privateKey || !subject) {
    throw new NotificationDeliveryError("Web Push delivery is not configured.", {
      code: "PUSH_NOT_CONFIGURED",
      retryable: false,
    });
  }
  let response: Response;
  try {
    const request = generateRequestDetails(
      {
        endpoint: options.subscription.endpoint,
        keys: { p256dh: options.subscription.p256dh, auth: options.subscription.auth },
      },
      options.payload,
      {
        TTL: 86_400,
        urgency: "normal",
        topic: options.topic,
        vapidDetails: { subject, publicKey, privateKey },
      },
    );
    response = await fetch(request.endpoint, {
      method: request.method,
      headers: request.headers,
      body: new Uint8Array(request.body),
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new NotificationDeliveryError("The push service request failed.", {
      cause: error,
      code: "PUSH_NETWORK_ERROR",
    });
  }
  await response.body?.cancel();
  if (!response.ok) {
    const status = response.status;
    const stale = status === 404 || status === 410;
    throw new NotificationDeliveryError("The push service rejected the subscription.", {
      code: stale ? "PUSH_SUBSCRIPTION_STALE" : "PUSH_REJECTED",
      httpStatus: status,
      retryable: !stale && (status === 408 || status === 429 || status >= 500),
      staleDestination: stale,
    });
  }
  return response.status;
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
