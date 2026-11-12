import { withLogBackgroundTasks } from "@portfolio/api/logging";
import { withPublicPortfolioRequest } from "@portfolio/api/public-portfolio";
import { getCronEnv } from "@portfolio/env/cron";
import handler from "@tanstack/react-start/server-entry";
import { z } from "zod";

import { localeRedirect } from "@/i18n/locale-request.server";
import { fetchHono } from "@/lib/hono.server";
import { applyResponseHeaders } from "@/lib/security-headers.server";
import {
  flushTelemetry,
  flushTelemetryAtStreamEnd,
  initializeTelemetry,
} from "@/lib/telemetry.server";
import { workerContext } from "@/lib/worker-context.server";

z.config({ jitless: true });

function runWithWorkerContext<T>(env: Env, ctx: ExecutionContext, handle: () => T) {
  return workerContext.run({ env, ctx }, () =>
    withLogBackgroundTasks((task) => ctx.waitUntil(task), handle),
  );
}

export default {
  fetch(request, env, ctx) {
    return runWithWorkerContext(env, ctx, () =>
      withPublicPortfolioRequest(async () => {
        initializeTelemetry();
        const path = new URL(request.url).pathname;
        const locale = localeRedirect(request);
        if (locale instanceof Response) return locale;
        const response = await handler.fetch(request);
        if (response.status >= 500)
          console.error("Worker request failed", {
            method: request.method,
            path,
            status: response.status,
          });
        const headers = new Headers(response.headers);
        applyResponseHeaders(headers, path);
        locale?.forEach((value, key) => headers.append(key, value));
        flushTelemetry(ctx);
        return new Response(flushTelemetryAtStreamEnd(response, ctx), {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }),
    );
  },
  async scheduled(_event, env, ctx) {
    await runWithWorkerContext(env, ctx, async () => {
      initializeTelemetry();
      const response = await fetchHono("https://portfolio.internal/api/blog/generate", {
        headers: { Authorization: `Bearer ${getCronEnv().secret}` },
      });
      await response.body?.cancel();
      flushTelemetry(ctx);
      if (!response.ok) throw new Error(`Scheduled blog generation failed (${response.status}).`);
    });
  },
} satisfies ExportedHandler<Env>;
