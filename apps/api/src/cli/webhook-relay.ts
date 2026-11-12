import { serve } from "@hono/node-server";
import { getWebhookRelaySecret } from "@portfolio/env/notifications-server";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";

import { constantTimeEqual } from "../lib/secure-compare";
import { NotificationDeliveryError } from "../services/notifications/errors";
import { postValidatedWebhook, validateWebhookUrl } from "../services/notifications/webhook";

const app = new Hono();
const token = `Bearer ${getWebhookRelaySecret()}`;
const payload = z.object({
  url: z.url().max(2_048),
  body: z.string().max(32_768),
  headers: z.object({
    "X-Portfolio-Event": z.enum(["blog.published", "webhook.test"]),
    "X-Portfolio-Delivery": z.string().regex(/^[0-9A-Za-z:_-]{1,128}$/),
    "X-Portfolio-Timestamp": z.string().regex(/^\d{1,16}$/),
    "X-Portfolio-Signature": z.string().regex(/^v1=[\w+/=-]{32,128}$/),
    "X-Webhook-Version": z.literal("1"),
  }),
});

app.post(
  "/",
  async (c, next) => {
    c.header("Cache-Control", "no-store");
    if (!constantTimeEqual(c.req.header("authorization") ?? "", token)) {
      return c.json({ code: "WEBHOOK_RELAY_UNAUTHORIZED", retryable: false }, 401);
    }
    await next();
  },
  bodyLimit({
    maxSize: 64 * 1024,
    onError: (c) => c.json({ code: "WEBHOOK_RELAY_PAYLOAD_TOO_LARGE", retryable: false }, 413),
  }),
  async (c) => {
    const parsed = payload.safeParse(await c.req.json<unknown>().catch(() => null));
    if (!parsed.success)
      return c.json({ code: "WEBHOOK_RELAY_INVALID_PAYLOAD", retryable: false }, 400);
    try {
      // Resolve and pin again at the process that opens the socket.
      const destination = await validateWebhookUrl(parsed.data.url, "generic", "production");
      return c.json(
        await postValidatedWebhook(destination, parsed.data.body, {
          ...parsed.data.headers,
          "Content-Type": "application/json; charset=utf-8",
          "User-Agent": "Zomer-Portfolio-Webhooks/1.0",
        }),
      );
    } catch (error) {
      if (error instanceof NotificationDeliveryError) {
        return c.json(
          { code: error.code, retryable: error.retryable },
          error.retryable ? 502 : 400,
        );
      }
      return c.json({ code: "WEBHOOK_RELAY_ERROR", retryable: true }, 502);
    }
  },
);

serve({
  fetch: app.fetch,
  hostname: process.env.HOST ?? "127.0.0.1",
  port: z.coerce
    .number()
    .int()
    .min(1)
    .max(65_535)
    .parse(process.env.PORT ?? 8788),
});
