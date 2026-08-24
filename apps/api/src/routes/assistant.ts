import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";
import { ApiError } from "../errors";
import { createAssistantChatResponse } from "../services/assistant/chat";
import { AssistantRateLimitError, loadChatHistory } from "../services/assistant/conversation";
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
  .get("/sessions/:sessionKey/messages", async (c) => {
    const sessionKey = z.string().uuid().safeParse(c.req.param("sessionKey"));
    if (!sessionKey.success) invalidRequest(sessionKey.error);
    return c.json({ messages: await loadChatHistory(sessionKey.data) });
  });
