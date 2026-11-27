import { withLogBackgroundTasks } from "@portfolio/api/logging";
import { withPublicPortfolioRequest } from "@portfolio/api/public-portfolio";
import handler from "@tanstack/react-start/server-entry";
import { z } from "zod";

import { localeRedirect } from "@/i18n/locale-request.server";
import { servePublicCache } from "@/lib/edge-cache.server";
import { applyResponseHeaders } from "@/lib/security-headers.server";
import { workerContext } from "@/lib/worker-context.server";

z.config({ jitless: true });

function runWithWorkerContext<T>(env: Env, ctx: ExecutionContext, handle: () => T) {
  return workerContext.run({ env, ctx }, () =>
    withLogBackgroundTasks((task) => ctx.waitUntil(task), handle),
  );
}

async function limitChatRequest(request: Request, path: string, limiter: RateLimit) {
  if (request.method !== "POST" || !/^\/api\/ai\/chat\/?$/.test(path)) return;
  const key = request.headers.get("CF-Connecting-IP");
  if (!key || (await limiter.limit({ key })).success) return;

  const requestId = crypto.randomUUID();
  return Response.json(
    {
      error: { code: "AI_RATE_LIMITED", message: "Too many chat requests. Try again in a minute." },
      requestId,
    },
    { status: 429, headers: { "Retry-After": "60", "X-Request-Id": requestId } },
  );
}

export default {
  fetch(request, env, ctx) {
    const url = new URL(request.url);
    const locale = localeRedirect(request, url);
    if (locale instanceof Response) return locale;

    const render = () =>
      runWithWorkerContext(env, ctx, () =>
        withPublicPortfolioRequest(async () => {
          const path = url.pathname;
          const limited = await limitChatRequest(request, path, env.AI_REQUEST_LIMIT);
          const telemetry =
            !limited &&
            env.LANGFUSE_PUBLIC_KEY &&
            env.LANGFUSE_SECRET_KEY &&
            ((request.method === "POST" && path.startsWith("/admin/_serverFn/")) ||
              /^\/api\/(?:ai\/chat|blog\/generate|admin\/ai\/reindex(?:\/stream)?)\/?$/.test(
                path,
              ) ||
              path === "/admin/api/ai/reindex")
              ? await import("@/lib/telemetry.server")
              : undefined;
          telemetry?.initializeTelemetry();
          const response = limited ?? (await handler.fetch(request));
          if (response.status >= 500)
            console.error("Worker request failed", {
              method: request.method,
              path,
              status: response.status,
            });
          const headers = new Headers(response.headers);
          applyResponseHeaders(headers, url, request, response.status, env.SITE_URL);
          telemetry?.flushTelemetry(ctx);
          return new Response(
            telemetry ? telemetry.flushTelemetryAtStreamEnd(response, ctx) : response.body,
            {
              status: response.status,
              statusText: response.statusText,
              headers,
            },
          );
        }),
      );
    const response = servePublicCache(request, url, env.CF_VERSION_METADATA?.id, ctx, render);
    if (!locale) return response;
    // A locale-prefixed page renders from its URL alone. Record the explicit preference after the
    // cache lookup so the shared entry never stores this visitor's Set-Cookie.
    return response.then((localized) => {
      const vary = new Set(
        (localized.headers.get("Vary") ?? "")
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean),
      );
      locale.forEach((value, key) => {
        if (key === "set-cookie") localized.headers.append(key, value);
        else if (key === "vary") for (const name of value.split(",")) vary.add(name.trim());
        else localized.headers.set(key, value);
      });
      localized.headers.set("Vary", [...vary].join(", "));
      return localized;
    });
  },
  async scheduled(event, env, ctx) {
    await runWithWorkerContext(env, ctx, async () => {
      const [{ generateScheduledBlog }, telemetry] = await Promise.all([
        import("@portfolio/api/blog-generation"),
        env.LANGFUSE_PUBLIC_KEY && env.LANGFUSE_SECRET_KEY
          ? import("@/lib/telemetry.server")
          : undefined,
      ]);
      telemetry?.initializeTelemetry();
      try {
        await generateScheduledBlog(event.scheduledTime);
      } finally {
        telemetry?.flushTelemetry(ctx);
      }
    });
  },
} satisfies ExportedHandler<Env>;
