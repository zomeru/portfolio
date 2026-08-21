import { Hono } from "hono";
import { type RequestIdVariables, requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";

const nodeEnv = process.env.NODE_ENV === "production" ? "production" : "development";

const app = new Hono<{ Variables: RequestIdVariables }>();

app.use("*", requestId());
app.use("*", secureHeaders());
app.use("*", async (c, next) => {
  const startedAt = performance.now();
  await next();

  console.log(
    JSON.stringify({
      level: "info",
      message: "request completed",
      requestId: c.get("requestId"),
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Math.round(performance.now() - startedAt),
    }),
  );
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.notFound((c) => c.json({ error: "Not found", requestId: c.get("requestId") }, 404));

app.onError((error, c) => {
  console.error(
    JSON.stringify({
      level: "error",
      message: "request failed",
      requestId: c.get("requestId"),
      error: error.message,
      ...(nodeEnv === "development" ? { stack: error.stack } : {}),
    }),
  );

  return c.json({ error: "Internal server error", requestId: c.get("requestId") }, 500);
});

export default app;
