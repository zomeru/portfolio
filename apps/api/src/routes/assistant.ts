import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { validator } from "hono/validator";
import { z } from "zod";

import { ApiError } from "../errors";
import { createAssistantChatResponse } from "../services/assistant/chat";
import {
  AssistantRateLimitError,
  decodeChatHistoryCursor,
  loadChatHistoryPage,
} from "../services/assistant/conversation";
import {
  OfflineSyncConflictError,
  OfflineSyncRateLimitError,
  OfflineSyncTimestampError,
  synchronizeOfflineConversation,
} from "../services/assistant/offline-sync";
import type { ApiEnv } from "../types/hono";

const chatRequestSchema = z.object({
  sessionKey: z.string().uuid(),
  message: z.object({
    id: z.string().trim().min(1).max(255),
    role: z.literal("user"),
    parts: z
      .array(z.object({ type: z.literal("text"), text: z.string().trim().min(1).max(4_000) }))
      .min(1)
      .max(1),
  }),
});
const chatHistoryQuerySchema = z.object({ cursor: z.string().max(512).optional() });
const offlineSourceSchema = z.object({
  id: z.string().trim().min(1).max(255),
  title: z.string().trim().min(1).max(500),
  url: z.string().trim().min(1).max(2_048),
  sourceType: z.enum(["profile", "experience", "project", "blog", "techstack"]),
});
const offlineSyncMessageSchema = z.discriminatedUnion("role", [
  z.object({
    content: z.string().trim().min(1).max(4_000),
    createdAt: z.iso.datetime({ offset: true }),
    id: z.uuid(),
    role: z.literal("user"),
  }),
  z.object({
    content: z.string().trim().min(1).max(12_000),
    createdAt: z.iso.datetime({ offset: true }),
    id: z.uuid(),
    model: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .regex(/^offline:/u),
    role: z.literal("assistant"),
    sources: z.array(offlineSourceSchema).max(8).default([]),
  }),
]);
const offlineSyncRequestSchema = z.object({
  messages: z.array(offlineSyncMessageSchema).min(1).max(20),
});

function invalidRequest(cause?: unknown): never {
  throw new ApiError("The chat request is invalid.", {
    code: "AI_REQUEST_INVALID",
    status: 400,
    cause,
  });
}

export const assistantRoutes = new Hono<ApiEnv>()
  .post(
    "/chat",
    bodyLimit({
      maxSize: 32 * 1_024,
      onError: (c) =>
        c.json(
          {
            error: { code: "AI_REQUEST_INVALID", message: "The chat request is too large." },
            requestId: c.get("requestId"),
          },
          413,
        ),
    }),
    async (c) => {
      let value: unknown;
      try {
        value = await c.req.json();
      } catch (error) {
        invalidRequest(error);
      }
      const request = chatRequestSchema.safeParse(value);
      if (!request.success) invalidRequest(request.error);

      try {
        return await createAssistantChatResponse({
          sessionKey: request.data.sessionKey,
          messageId: request.data.message.id,
          text: request.data.message.parts[0]?.text ?? "",
          abortSignal: c.req.raw.signal,
        });
      } catch (error) {
        if (error instanceof AssistantRateLimitError) {
          throw new ApiError(error.message, { code: "AI_RATE_LIMITED", status: 429 });
        }
        if (error instanceof ApiError) throw error;
        throw new ApiError("Zomer AI is temporarily unavailable.", {
          code: "AI_PROVIDER_UNAVAILABLE",
          status: 503,
          cause: error,
        });
      }
    },
  )
  .get(
    "/sessions/:sessionKey/messages",
    validator("query", (value) => {
      const query = chatHistoryQuerySchema.safeParse(value);
      if (!query.success) invalidRequest(query.error);
      return query.data;
    }),
    async (c) => {
      const sessionKey = z.string().uuid().safeParse(c.req.param("sessionKey"));
      if (!sessionKey.success) invalidRequest(sessionKey.error);
      const cursorValue = c.req.valid("query").cursor;
      const cursor = cursorValue ? decodeChatHistoryCursor(cursorValue) : undefined;
      if (cursorValue && !cursor) invalidRequest();
      return c.json(
        await loadChatHistoryPage({
          sessionKey: sessionKey.data,
          ...(cursor ? { cursor } : {}),
        }),
      );
    },
  )
  .post(
    "/sessions/:sessionKey/offline-messages",
    bodyLimit({
      maxSize: 256 * 1_024,
      onError: (c) =>
        c.json(
          {
            error: { code: "AI_REQUEST_INVALID", message: "The sync request is too large." },
            requestId: c.get("requestId"),
          },
          413,
        ),
    }),
    async (c) => {
      const sessionKey = z.string().uuid().safeParse(c.req.param("sessionKey"));
      if (!sessionKey.success) invalidRequest(sessionKey.error);

      let value: unknown;
      try {
        value = await c.req.json();
      } catch (error) {
        invalidRequest(error);
      }
      const request = offlineSyncRequestSchema.safeParse(value);
      if (!request.success) invalidRequest(request.error);

      try {
        return c.json(
          await synchronizeOfflineConversation({
            sessionKey: sessionKey.data,
            messages: request.data.messages,
          }),
        );
      } catch (error) {
        if (error instanceof OfflineSyncConflictError) {
          throw new ApiError(error.message, { code: "AI_SYNC_CONFLICT", status: 409 });
        }
        if (error instanceof OfflineSyncTimestampError) {
          throw new ApiError(error.message, { code: "AI_SYNC_TIMESTAMP_INVALID", status: 400 });
        }
        if (error instanceof OfflineSyncRateLimitError) {
          throw new ApiError(error.message, { code: "AI_RATE_LIMITED", status: 429 });
        }
        throw error;
      }
    },
  );
