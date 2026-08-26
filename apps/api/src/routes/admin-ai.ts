import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { z } from "zod";
import { ApiError } from "../errors";
import { verifyAdminSessionToken } from "../lib/admin-session";
import { logError } from "../lib/log";
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
  if (!verifyAdminSessionToken(token, "ai-reindex")) {
    throw new ApiError("Unauthorized", { code: "UNAUTHORIZED", status: 401 });
  }
}

async function parseReindexRequest(request: Request) {
  let value: unknown = {};
  try {
    value = await request.json();
  } catch {
    value = {};
  }
  const result = reindexSchema.safeParse(value);
  if (!result.success) {
    throw new ApiError("The reindex request is invalid.", {
      code: "AI_REQUEST_INVALID",
      status: 400,
    });
  }
  return result.data;
}

async function runReindex(force: boolean, onProgress?: (message: string) => void) {
  try {
    return await synchronizePortfolioKnowledge({
      trigger: "admin",
      force,
      ...(onProgress ? { onProgress } : {}),
    });
  } catch (error) {
    if (error instanceof IngestionAlreadyRunningError) {
      throw new ApiError(error.message, {
        cause: error,
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
}

export const adminAiRoutes = new Hono<ApiEnv>()
  .use("*", async (c, next) => {
    requireAdmin(c.req.header("Authorization"));
    await next();
  })
  .get("/status", async (c) => c.json(await getKnowledgeIndexStatus()))
  .get("/ingestion-runs", async (c) => c.json({ runs: await listIngestionRuns() }))
  .post("/reindex", async (c) => {
    const request = await parseReindexRequest(c.req.raw);
    const summary = await runReindex(request.force);
    return c.json({ status: "completed", ...summary });
  })
  .post("/reindex/stream", async (c) => {
    const request = await parseReindexRequest(c.req.raw);
    c.header("Cache-Control", "no-cache, no-store, must-revalidate");
    c.header("X-Accel-Buffering", "no");

    return streamText(c, async (stream) => {
      let connected = true;
      let pendingWrite = Promise.resolve();
      stream.onAbort(() => {
        connected = false;
      });

      const send = (event: Record<string, unknown>) => {
        if (!connected) return;
        pendingWrite = pendingWrite
          .then(async () => {
            await stream.writeln(JSON.stringify(event));
          })
          .catch(() => {
            connected = false;
          });
      };

      try {
        const summary = await runReindex(request.force, (message) => {
          send({ type: "progress", message });
        });
        send({ type: "complete", summary });
      } catch (error) {
        logError("streamed portfolio reindex failed", error, {
          operation: "assistant.streamReindex",
          force: request.force,
        });
        send({
          type: "error",
          message: error instanceof ApiError ? error.message : "Portfolio indexing failed.",
        });
      }

      await pendingWrite;
    });
  });
