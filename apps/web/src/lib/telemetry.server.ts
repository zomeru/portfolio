import "@tanstack/react-start/server-only";
import { LangfuseSpanProcessor } from "@langfuse/otel";
import { LangfuseVercelAiSdkIntegration } from "@langfuse/vercel-ai-sdk";
import { context, trace } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { BasicTracerProvider } from "@opentelemetry/sdk-trace-base";
import { getLangfuseServerEnv } from "@portfolio/env/langfuse-server";
import { registerTelemetry } from "ai";

let provider: BasicTracerProvider | undefined;

export function initializeTelemetry() {
  if (provider) return;
  const environment = getLangfuseServerEnv();
  if (!environment.enabled || !environment.publicKey || !environment.secretKey) return;

  provider = new BasicTracerProvider({
    spanProcessors: [
      new LangfuseSpanProcessor({
        publicKey: environment.publicKey,
        secretKey: environment.secretKey,
        baseUrl: environment.baseUrl,
        exportMode: "immediate",
        mediaUploadEnabled: false,
      }),
    ],
  });
  context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
  trace.setGlobalTracerProvider(provider);
  registerTelemetry(new LangfuseVercelAiSdkIntegration());
}

export function flushTelemetry(ctx: ExecutionContext) {
  if (provider) {
    ctx.waitUntil(provider.forceFlush().catch(() => console.warn("Langfuse trace flush failed")));
  }
}

export function flushTelemetryAtStreamEnd(response: Response, ctx: ExecutionContext) {
  if (!provider || !response.body) return response.body;
  return response.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      flush() {
        flushTelemetry(ctx);
      },
    }),
  );
}
