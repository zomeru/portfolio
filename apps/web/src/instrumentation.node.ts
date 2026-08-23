import { LangfuseSpanProcessor } from "@langfuse/otel";
import { LangfuseVercelAiSdkIntegration } from "@langfuse/vercel-ai-sdk";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getLangfuseServerEnv } from "@portfolio/env/langfuse-server";
import { registerTelemetry } from "ai";

const LANGFUSE_INITIALIZED = Symbol.for("portfolio.langfuse.initialized");
const runtime = globalThis as typeof globalThis & { [LANGFUSE_INITIALIZED]?: boolean };
const environment = getLangfuseServerEnv();

if (
  environment.enabled &&
  environment.publicKey &&
  environment.secretKey &&
  !runtime[LANGFUSE_INITIALIZED]
) {
  const processor = new LangfuseSpanProcessor({
    publicKey: environment.publicKey,
    secretKey: environment.secretKey,
    baseUrl: environment.baseUrl,
    exportMode: "immediate",
    mediaUploadEnabled: false,
  });
  const sdk = new NodeSDK({ spanProcessors: [processor] });
  sdk.start();
  registerTelemetry(new LangfuseVercelAiSdkIntegration());
  runtime[LANGFUSE_INITIALIZED] = true;
}
