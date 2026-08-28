import { Hono } from "hono";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { ApiError } from "./errors";
import { captureError, errorLogMetadata, log, withLogContext } from "./lib/log";
import { adminAiRoutes } from "./routes/admin-ai";
import { adminErrorRoutes } from "./routes/admin-errors";
import { assistantRoutes } from "./routes/assistant";
import { blogGenerationRoutes } from "./routes/blog-generation";
import { githubRoutes } from "./routes/github";
import { notificationRoutes } from "./routes/notifications";
import { publicApiRoutes } from "./routes/public";
import type { ApiEnv } from "./types/hono";

const app = new Hono<ApiEnv>().basePath("/api");

app.use("*", requestId());
app.use("*", secureHeaders());
app.use("*", async (c, next) => {
  const startedAt = performance.now();
  await withLogContext(
    {
      requestId: c.get("requestId"),
      method: c.req.method,
      path: c.req.path,
      userAgent: c.req.header("user-agent"),
    },
    next,
  );

  log("info", "request completed", {
    requestId: c.get("requestId"),
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: Math.round(performance.now() - startedAt),
  });
});

export const apiApp = app
  .get("/", (c) => c.json({ service: "portfolio-api", status: "ok" }))
  .route("/ai", assistantRoutes)
  .route("/admin/ai", adminAiRoutes)
  .route("/admin/errors", adminErrorRoutes)
  .route("/blog", blogGenerationRoutes)
  .route("/github", githubRoutes)
  .route("/notifications", notificationRoutes)
  .route("/v1", publicApiRoutes);

apiApp.notFound((c) =>
  c.json(
    { error: { code: "NOT_FOUND", message: "Not found" }, requestId: c.get("requestId") },
    404,
  ),
);

apiApp.onError(async (error, c) => {
  const apiError = error instanceof ApiError ? error : null;
  const status = (apiError?.status ?? 500) as ContentfulStatusCode;

  const metadata = {
    requestId: c.get("requestId"),
    errorCode: apiError?.code ?? "INTERNAL_ERROR",
    status,
    route: c.req.path,
    method: c.req.method,
    userAgent: c.req.header("user-agent"),
    operation: "api.request",
  };
  if (status >= 500) {
    await captureError("request failed", error, metadata);
  } else {
    log("warn", "request failed", { ...metadata, ...errorLogMetadata(error, "api.request") });
  }

  return c.json(
    {
      error: {
        code: apiError?.code ?? "INTERNAL_ERROR",
        message: apiError?.message ?? "Internal server error",
      },
      requestId: c.get("requestId"),
    },
    status,
  );
});
