import { randomUUID } from "node:crypto";
import type { LookupAddress } from "node:dns";
import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { BlockList, isIP } from "node:net";

import {
  type StoredBlogPublishedEvent,
  upsertWebhookSubscription,
  type WebhookDestinationTypeValue,
} from "@portfolio/database";

import {
  createSecretToken,
  decryptSecret,
  encryptSecret,
  hashToken,
  signWebhookPayload,
} from "./crypto";
import { NotificationDeliveryError } from "./errors";

const MAX_RESPONSE_BYTES = 64 * 1024;
const REQUEST_TIMEOUT_MS = 8_000;
const blockedAddresses = new BlockList();
const developmentLoopbackAddresses = new BlockList();

developmentLoopbackAddresses.addSubnet("127.0.0.0", 8, "ipv4");
developmentLoopbackAddresses.addAddress("::1", "ipv6");
developmentLoopbackAddresses.addSubnet("::ffff:127.0.0.0", 104, "ipv6");

for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blockedAddresses.addSubnet(network, prefix, "ipv4");
}

for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["100::", 64],
  ["2001:db8::", 32],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  blockedAddresses.addSubnet(network, prefix, "ipv6");
}

export function isBlockedWebhookAddress(address: string, nodeEnvironment = process.env.NODE_ENV) {
  const family = isIP(address);
  if (family === 0) return true;
  const addressType = family === 4 ? "ipv4" : "ipv6";
  if (
    nodeEnvironment === "development" &&
    developmentLoopbackAddresses.check(address, addressType)
  ) {
    return false;
  }
  return blockedAddresses.check(address, addressType);
}

function validateDestinationHost(url: URL, destinationType: WebhookDestinationTypeValue) {
  if (destinationType === "slack") {
    const allowed = new Set(["hooks.slack.com", "hooks.slack-gov.com"]);
    if (!allowed.has(url.hostname)) {
      throw new NotificationDeliveryError(
        "Slack destinations must use an official incoming-webhook host.",
        {
          code: "WEBHOOK_INVALID_SLACK_HOST",
          retryable: false,
        },
      );
    }
  }
  if (destinationType === "discord") {
    const allowed = new Set(["discord.com", "discordapp.com"]);
    if (!allowed.has(url.hostname) || !url.pathname.startsWith("/api/webhooks/")) {
      throw new NotificationDeliveryError(
        "Discord destinations must use an official webhook URL.",
        {
          code: "WEBHOOK_INVALID_DISCORD_HOST",
          retryable: false,
        },
      );
    }
  }
}

export async function validateWebhookUrl(
  value: string,
  destinationType: WebhookDestinationTypeValue = "generic",
) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new NotificationDeliveryError("Webhook URL is invalid.", {
      code: "WEBHOOK_INVALID_URL",
      retryable: false,
    });
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443")
  ) {
    throw new NotificationDeliveryError(
      "Webhook URLs must use HTTPS on the default port without embedded credentials.",
      { code: "WEBHOOK_UNSAFE_URL", retryable: false },
    );
  }
  validateDestinationHost(url, destinationType);

  let records: LookupAddress[];
  try {
    records = await lookup(url.hostname, { all: true, verbatim: true });
  } catch (error) {
    throw new NotificationDeliveryError("Webhook DNS lookup failed.", {
      cause: error,
      code: "WEBHOOK_DNS_ERROR",
    });
  }
  if (records.length === 0 || records.some((record) => isBlockedWebhookAddress(record.address))) {
    throw new NotificationDeliveryError(
      "Webhook URL does not resolve to a permitted public address.",
      {
        code: "WEBHOOK_PRIVATE_ADDRESS",
        retryable: false,
      },
    );
  }
  return { url, records };
}

function postPinnedHttps(options: {
  url: URL;
  address: string;
  family: number;
  body: string;
  headers: Record<string, string>;
}) {
  return new Promise<{ statusCode: number }>((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      callback();
    };
    const request = httpsRequest(
      {
        protocol: "https:",
        hostname: options.address,
        family: options.family,
        port: 443,
        method: "POST",
        path: `${options.url.pathname}${options.url.search}`,
        servername: options.url.hostname,
        rejectUnauthorized: true,
        headers: {
          ...options.headers,
          Host: options.url.host,
          "Content-Length": Buffer.byteLength(options.body).toString(),
        },
      },
      (response) => {
        let bytes = 0;
        response.on("data", (chunk: Buffer) => {
          bytes += chunk.byteLength;
          if (bytes > MAX_RESPONSE_BYTES) {
            request.destroy();
            finish(() =>
              reject(
                new NotificationDeliveryError("Webhook response exceeded the permitted size.", {
                  code: "WEBHOOK_RESPONSE_TOO_LARGE",
                  retryable: false,
                }),
              ),
            );
          }
        });
        response.on("end", () => finish(() => resolve({ statusCode: response.statusCode ?? 502 })));
      },
    );
    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy();
      finish(() =>
        reject(
          new NotificationDeliveryError("Webhook delivery timed out.", {
            code: "WEBHOOK_TIMEOUT",
          }),
        ),
      );
    });
    request.on("error", (error) =>
      finish(() =>
        reject(
          new NotificationDeliveryError("Webhook delivery failed before a response was received.", {
            cause: error,
            code: "WEBHOOK_NETWORK_ERROR",
          }),
        ),
      ),
    );
    request.end(options.body);
  });
}

function escapeSlack(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function createWebhookBody(
  destinationType: WebhookDestinationTypeValue,
  event: StoredBlogPublishedEvent,
) {
  const blog = event.data.blog;
  if (destinationType === "slack") {
    return JSON.stringify({
      text: `New blog published: ${blog.title}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*New blog published*\n<${blog.url}|${escapeSlack(blog.title)}>${blog.excerpt ? `\n${escapeSlack(blog.excerpt)}` : ""}`,
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
                new Date(blog.publishedAt),
              ),
            },
          ],
        },
      ],
    });
  }
  if (destinationType === "discord") {
    return JSON.stringify({
      content: `New blog published: ${blog.title}`,
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: blog.title.slice(0, 256),
          url: blog.url,
          description: blog.excerpt?.slice(0, 4_096),
          timestamp: blog.publishedAt,
        },
      ],
    });
  }
  return JSON.stringify(event);
}

export function createWebhookTestBody(
  destinationType: WebhookDestinationTypeValue,
  options: { id: string; createdAt: string; blogUrl: string },
) {
  if (destinationType === "slack") {
    return JSON.stringify({
      text: "Blog notifications connected",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Blog notifications connected*\nThis channel will receive a message when a new blog is published.\n<${options.blogUrl}|View published posts>`,
          },
        },
      ],
    });
  }
  if (destinationType === "discord") {
    return JSON.stringify({
      content: "Webhook test successful",
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: "Blog notifications connected",
          url: options.blogUrl,
          description: "This channel will receive a message when a new blog is published.",
          timestamp: options.createdAt,
        },
      ],
    });
  }
  return JSON.stringify({
    id: options.id,
    type: "webhook.test",
    apiVersion: "1",
    createdAt: options.createdAt,
    data: {
      message: "Blog notifications connected",
      blogUrl: options.blogUrl,
    },
  });
}

export function isRetryableWebhookStatus(statusCode: number) {
  return statusCode === 408 || statusCode === 425 || statusCode === 429 || statusCode >= 500;
}

export async function registerWebhookSubscription(options: {
  name: string;
  url: string;
  destinationType: WebhookDestinationTypeValue;
}) {
  const { url } = await validateWebhookUrl(options.url, options.destinationType);
  const secret = options.destinationType === "generic" ? createSecretToken(32) : null;
  const subscription = await upsertWebhookSubscription({
    name: options.name,
    destinationType: options.destinationType,
    urlHash: hashToken(url.href),
    encryptedUrl: encryptSecret(url.href),
    encryptedSecret: secret ? encryptSecret(secret) : null,
  });
  return {
    id: subscription.id,
    name: subscription.name,
    destinationType: subscription.destinationType,
    secret,
  };
}

type StoredWebhookDestination = {
  destinationType: WebhookDestinationTypeValue;
  encryptedUrl: string;
  encryptedSecret: string | null;
};

async function postWebhook(options: {
  deliveryId: string;
  eventType: "blog.published" | "webhook.test";
  apiVersion: "1";
  subscription: StoredWebhookDestination;
  body: string;
}) {
  const destinationUrl = decryptSecret(options.subscription.encryptedUrl);
  const validated = await validateWebhookUrl(destinationUrl, options.subscription.destinationType);
  if (options.subscription.destinationType === "discord") {
    validated.url.searchParams.set("wait", "true");
  }
  const timestamp = Math.floor(Date.now() / 1_000).toString();
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "User-Agent": "Zomer-Portfolio-Webhooks/1.0",
  };
  if (options.subscription.destinationType === "generic") {
    if (!options.subscription.encryptedSecret) {
      throw new NotificationDeliveryError("Generic webhook signing secret is unavailable.", {
        code: "WEBHOOK_SECRET_MISSING",
        retryable: false,
      });
    }
    const secret = decryptSecret(options.subscription.encryptedSecret);
    headers["X-Portfolio-Event"] = options.eventType;
    headers["X-Portfolio-Delivery"] = options.deliveryId;
    headers["X-Portfolio-Timestamp"] = timestamp;
    headers["X-Portfolio-Signature"] = `v1=${signWebhookPayload(secret, timestamp, options.body)}`;
    headers["X-Webhook-Version"] = options.apiVersion;
  }
  const target = validated.records[0];
  if (!target) {
    throw new NotificationDeliveryError("Webhook URL has no permitted public address.", {
      code: "WEBHOOK_DNS_EMPTY",
      retryable: false,
    });
  }
  const response = await postPinnedHttps({
    url: validated.url,
    address: target.address,
    family: target.family,
    body: options.body,
    headers,
  });
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new NotificationDeliveryError("Webhook destination returned a non-success response.", {
      code: `WEBHOOK_HTTP_${response.statusCode}`,
      httpStatus: response.statusCode,
      retryable: isRetryableWebhookStatus(response.statusCode),
    });
  }
  return response.statusCode;
}

export async function sendBlogPublishedWebhook(options: {
  deliveryId: string;
  subscription: StoredWebhookDestination;
  event: StoredBlogPublishedEvent;
}) {
  const body = createWebhookBody(options.subscription.destinationType, options.event);
  return postWebhook({
    deliveryId: options.deliveryId,
    eventType: options.event.type,
    apiVersion: options.event.apiVersion,
    subscription: options.subscription,
    body,
  });
}

export function sendWebhookTest(options: {
  subscription: StoredWebhookDestination;
  siteUrl: string;
}) {
  const id = `test_${randomUUID()}`;
  const body = createWebhookTestBody(options.subscription.destinationType, {
    id,
    createdAt: new Date().toISOString(),
    blogUrl: new URL("/blogs", options.siteUrl).href,
  });
  return postWebhook({
    deliveryId: id,
    eventType: "webhook.test",
    apiVersion: "1",
    subscription: options.subscription,
    body,
  });
}
