import { randomUUID } from "node:crypto";

import { type Context, Hono } from "hono";

import { ApiError } from "../errors";
import { requireCronAuthorization } from "../lib/auth";
import type { ApiEnv } from "../types/hono";

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

function createManualGenerationKey(idempotencyKey: string | undefined) {
  if (idempotencyKey && !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    throw new ApiError("Idempotency-Key must contain 8-128 safe characters.", {
      code: "INVALID_IDEMPOTENCY_KEY",
      status: 422,
    });
  }

  return `manual:${idempotencyKey ?? randomUUID()}`;
}

async function respondWithGeneration(
  c: Context<ApiEnv>,
  input: { generationKey: string; trigger: "manual" | "scheduled" },
) {
  c.header("Cache-Control", "no-store");
  requireCronAuthorization(c.req.header("Authorization"));

  const { generateAndPublishBlog } = await import("../services/blog-generation/service");
  const result = await generateAndPublishBlog(input);
  return c.json(
    {
      success: true,
      created: result.created,
      indexing: result.indexing,
      notifications: result.notifications,
      post: {
        id: result.post._id,
        title: result.post.title,
        slug: result.post.slug.current,
        publishedAt: result.post.publishedAt,
      },
    },
    result.created ? 201 : 200,
  );
}

export const blogGenerationRoutes = new Hono<ApiEnv>()
  .get("/generate", (c) =>
    respondWithGeneration(c, {
      generationKey: `scheduled:${new Date().toISOString().slice(0, 10)}`,
      trigger: "scheduled",
    }),
  )
  .post("/generate", (c) =>
    respondWithGeneration(c, {
      generationKey: createManualGenerationKey(c.req.header("Idempotency-Key")),
      trigger: "manual",
    }),
  );
