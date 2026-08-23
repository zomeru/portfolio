import { Hono } from "hono";
import { z } from "zod";
import { ApiError } from "../errors";
import { verifyAdminSessionToken } from "../lib/admin-session";
import {
  getKnowledgeIndexStatus,
  IngestionAlreadyRunningError,
  listIngestionRuns,
  synchronizePortfolioKnowledge,
} from "../services/assistant/ingestion";
import type { ApiEnv } from "../types/hono";

const reindexSchema = z.object({ force: z.boolean().default(false) });

function requireAdmin(authorization: string | undefined) {
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;
  if (!verifyAdminSessionToken(token)) {
    throw new ApiError("Unauthorized", { code: "UNAUTHORIZED", status: 401 });
  }
}

export const adminAiRoutes = new Hono<ApiEnv>()
  .use("*", async (c, next) => {
    requireAdmin(c.req.header("Authorization"));
    await next();
  })
  .get("/status", async (c) => c.json(await getKnowledgeIndexStatus()))
  .get("/ingestion-runs", async (c) => c.json({ runs: await listIngestionRuns() }))
  .post("/reindex", async (c) => {
    let value: unknown = {};
    try {
      value = await c.req.json();
    } catch {
      value = {};
    }
    const request = reindexSchema.safeParse(value);
    if (!request.success) {
      throw new ApiError("The reindex request is invalid.", {
        code: "AI_REQUEST_INVALID",
        status: 400,
      });
    }

    try {
      return c.json(
        await synchronizePortfolioKnowledge({
          trigger: "admin",
          force: request.data.force,
        }),
      );
    } catch (error) {
      if (error instanceof IngestionAlreadyRunningError) {
        throw new ApiError(error.message, {
          code: "INGESTION_ALREADY_RUNNING",
          status: 409,
        });
      }
      throw new ApiError("Portfolio indexing failed.", {
        code: "INGESTION_FAILED",
        status: 502,
        cause: error,
      });
    }
  });
