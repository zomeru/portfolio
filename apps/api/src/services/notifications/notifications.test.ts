import assert from "node:assert/strict";
import test from "node:test";
import { getNotificationsServerEnv } from "@portfolio/env/notifications-server";
import { apiApp } from "../../app";
import { notificationRoutes } from "../../routes/notifications";
import {
  createUnsubscribeToken,
  parseUnsubscribeToken,
  signWebhookPayload,
  verifyWebhookSignature,
} from "./crypto";
import { createBlogPublishedEvent } from "./delivery";
import { isAllowedPushServiceEndpoint } from "./push";
import {
  createWebhookBody,
  createWebhookTestBody,
  isBlockedWebhookAddress,
  isRetryableWebhookStatus,
  validateWebhookUrl,
} from "./webhook";

const originalTokenSecret = process.env.NOTIFICATION_TOKEN_SECRET;
const originalCronSecret = process.env.CRON_SECRET;
const originalNodeEnv = process.env.NODE_ENV;
const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
process.env.NOTIFICATION_TOKEN_SECRET =
  "test-notification-token-secret-with-at-least-32-characters";
process.env.CRON_SECRET = "test-cron-secret-with-at-least-32-characters";

test.after(() => {
  if (originalTokenSecret === undefined) delete process.env.NOTIFICATION_TOKEN_SECRET;
  else process.env.NOTIFICATION_TOKEN_SECRET = originalTokenSecret;
  if (originalCronSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = originalCronSecret;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
});

test("unsubscribe tokens are signed, versioned, and tamper-resistant", () => {
  const token = createUnsubscribeToken("356c4ffc-05e3-4818-bc40-cabf4b7e6b85", 3);
  assert.deepEqual(parseUnsubscribeToken(token), {
    subscriptionId: "356c4ffc-05e3-4818-bc40-cabf4b7e6b85",
    version: 3,
  });
  assert.equal(parseUnsubscribeToken(`${token}x`), null);
});

test("notification environment keeps Gmail, Resend, and Web Push feature groups independent", () => {
  const tokenSecret = "test-notification-token-secret-with-at-least-32-characters";
  const pushOnly = getNotificationsServerEnv({
    NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY: "test-public-vapid-key-with-more-than-forty-characters",
    WEB_PUSH_VAPID_PRIVATE_KEY: "test-private-key",
    WEB_PUSH_SUBJECT: "mailto:owner@example.com",
    NOTIFICATION_TOKEN_SECRET: tokenSecret,
  });
  assert.equal(pushOnly.EMAIL_PROVIDER, "gmail");
  assert.equal(pushOnly.EMAIL_FROM, undefined);

  const gmail = getNotificationsServerEnv({
    EMAIL_FROM: "owner@gmail.com",
    GOOGLE_APP_PASSWORD: "abcd efgh ijkl mnop",
    NOTIFICATION_TOKEN_SECRET: tokenSecret,
  });
  assert.equal(gmail.GOOGLE_APP_PASSWORD, "abcdefghijklmnop");
  assert.equal(gmail.EMAIL_FROM_NAME, "Zomer Gregorio");

  const resend = getNotificationsServerEnv({
    EMAIL_PROVIDER: "resend",
    EMAIL_FROM: "blog@example.com",
    RESEND_API_KEY: "test-resend-key",
    NOTIFICATION_TOKEN_SECRET: tokenSecret,
  });
  assert.equal(resend.EMAIL_PROVIDER, "resend");
  assert.throws(
    () =>
      getNotificationsServerEnv({
        EMAIL_FROM: "owner@gmail.com",
        NOTIFICATION_TOKEN_SECRET: tokenSecret,
      }),
    /GOOGLE_APP_PASSWORD/,
  );
});

test("webhook signatures include the timestamp and enforce replay tolerance", () => {
  const now = new Date("2026-08-25T08:00:00.000Z");
  const timestamp = Math.floor(now.getTime() / 1_000).toString();
  const rawBody = JSON.stringify({ type: "blog.published" });
  const secret = "whsec_test";
  const signature = `v1=${signWebhookPayload(secret, timestamp, rawBody)}`;
  assert.equal(verifyWebhookSignature({ rawBody, timestamp, signature, secret, now }), true);
  assert.equal(
    verifyWebhookSignature({
      rawBody,
      timestamp,
      signature,
      secret,
      now: new Date(now.getTime() + 301_000),
    }),
    false,
  );
  assert.equal(
    verifyWebhookSignature({ rawBody: `${rawBody} `, timestamp, signature, secret, now }),
    false,
  );
});

test("blog publication event identifiers are stable for one Sanity revision", () => {
  const blog = {
    id: "blog-1",
    revision: "revision-1",
    title: "Durable notifications",
    slug: "durable-notifications",
    excerpt: "A test post.",
    publishedAt: "2026-08-25T08:00:00.000Z",
  };
  const first = createBlogPublishedEvent(
    blog,
    "https://example.com",
    new Date("2026-08-25T08:01:00Z"),
  );
  const repeated = createBlogPublishedEvent(
    blog,
    "https://example.com",
    new Date("2026-08-25T08:02:00Z"),
  );
  assert.equal(first.eventKey, repeated.eventKey);
  assert.equal(first.payload.id, repeated.payload.id);
  assert.equal(first.payload.data.blog.url, "https://example.com/blogs/durable-notifications");

  const discord = JSON.parse(createWebhookBody("discord", first.payload)) as {
    allowed_mentions: { parse: string[] };
    embeds: Array<{ title: string; url: string }>;
  };
  assert.deepEqual(discord.allowed_mentions.parse, []);
  assert.equal(discord.embeds[0]?.title, blog.title);
  assert.equal(discord.embeds[0]?.url, first.payload.data.blog.url);

  const slack = JSON.parse(createWebhookBody("slack", first.payload)) as {
    blocks: Array<{ type: string }>;
  };
  assert.equal(slack.blocks[0]?.type, "section");
  assert.deepEqual(JSON.parse(createWebhookBody("generic", first.payload)), first.payload);
});

test("webhook tests are clearly separated from publication events", () => {
  const options = {
    id: "test_123",
    createdAt: "2026-08-25T08:00:00.000Z",
    blogUrl: "https://example.com/blogs",
  };
  const generic = JSON.parse(createWebhookTestBody("generic", options)) as {
    id: string;
    type: string;
    data: { blogUrl: string };
  };
  assert.equal(generic.id, options.id);
  assert.equal(generic.type, "webhook.test");
  assert.equal(generic.data.blogUrl, options.blogUrl);

  const discord = JSON.parse(createWebhookTestBody("discord", options)) as {
    allowed_mentions: { parse: string[] };
    content: string;
    embeds: Array<{ title: string; url: string }>;
  };
  assert.equal(discord.content, "Webhook test successful");
  assert.deepEqual(discord.allowed_mentions.parse, []);
  assert.equal(discord.embeds[0]?.title, "Blog notifications connected");
  assert.equal(discord.embeds[0]?.url, options.blogUrl);

  const slack = JSON.parse(createWebhookTestBody("slack", options)) as {
    text: string;
  };
  assert.equal(slack.text, "Blog notifications connected");
});

test("SSRF validation blocks local, private, link-local, and metadata destinations", async () => {
  for (const address of ["127.0.0.1", "10.0.0.1", "169.254.169.254", "::1", "fc00::1"]) {
    assert.equal(isBlockedWebhookAddress(address), true, address);
  }
  assert.equal(isBlockedWebhookAddress("127.0.0.1", "development"), false);
  assert.equal(isBlockedWebhookAddress("::1", "development"), false);
  assert.equal(isBlockedWebhookAddress("10.0.0.1", "development"), true);
  assert.equal(isBlockedWebhookAddress("169.254.169.254", "development"), true);
  assert.equal(isBlockedWebhookAddress("162.159.136.232"), false);
  assert.equal(isBlockedWebhookAddress("::ffff:127.0.0.1"), true);
  assert.equal(isBlockedWebhookAddress("::ffff:162.159.136.232"), false);
  await assert.rejects(() => validateWebhookUrl("http://example.com/hook"), /HTTPS/);
  await assert.rejects(() => validateWebhookUrl("https://127.0.0.1/hook"), /public address/);
  await assert.rejects(
    () => validateWebhookUrl("https://example.com/hook", "discord"),
    /official webhook URL/,
  );
  assert.equal(isRetryableWebhookStatus(429), true);
  assert.equal(isRetryableWebhookStatus(503), true);
  assert.equal(isRetryableWebhookStatus(400), false);
});

test("Web Push accepts recognized services and rejects arbitrary HTTPS endpoints", () => {
  for (const endpoint of [
    "https://fcm.googleapis.com/fcm/send/example",
    "https://updates.push.services.mozilla.com/wpush/v2/example",
    "https://web.push.apple.com/example",
    "https://wns2-db5p.notify.windows.com/w/example",
  ]) {
    assert.equal(isAllowedPushServiceEndpoint(endpoint), true, endpoint);
  }
  for (const endpoint of [
    "https://127.0.0.1/push",
    "https://example.com/push",
    "https://notify.windows.com.example.com/push",
    "https://user:password@fcm.googleapis.com/push",
    "https://fcm.googleapis.com:8443/push",
  ]) {
    assert.equal(isAllowedPushServiceEndpoint(endpoint), false, endpoint);
  }
});

test("public subscription routes reject malformed payloads without provider calls", async () => {
  const emailResponse = await notificationRoutes.request("http://localhost/email/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email" }),
  });
  assert.equal(emailResponse.status, 400);

  const pushResponse = await notificationRoutes.request("http://localhost/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: "javascript:alert(1)", keys: {} }),
  });
  assert.equal(pushResponse.status, 400);

  const testResponse = await notificationRoutes.request("http://localhost/push/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: "not-a-push-endpoint" }),
  });
  assert.equal(testResponse.status, 400);
});

test("notification administration and test delivery require authorization", async () => {
  const webhookId = "356c4ffc-05e3-4818-bc40-cabf4b7e6b85";
  for (const request of [
    new Request("http://localhost/api/notifications/webhooks", { method: "GET" }),
    new Request(`http://localhost/api/notifications/webhooks/${webhookId}/test`, {
      method: "POST",
    }),
    new Request(`http://localhost/api/notifications/webhooks/${webhookId}`, {
      method: "DELETE",
    }),
    new Request("http://localhost/api/notifications/retry", { method: "POST" }),
  ]) {
    const response = await apiApp.request(request);
    assert.equal(response.status, 401);
  }
});

test("browser push testing requires authorization outside development", async () => {
  process.env.NODE_ENV = "production";
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
  try {
    const response = await apiApp.request(
      new Request("http://localhost/api/notifications/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: "https://example.com/push/subscription" }),
      }),
    );
    assert.equal(response.status, 401);
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }
});
