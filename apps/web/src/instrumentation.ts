import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node");
  }
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logError } = await import("@portfolio/api/logging");
    logError("Next.js server request failed", error, {
      operation: "next.onRequestError",
      service: "portfolio-web",
      route: context.routePath,
      requestPath: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
      ...(context.renderSource ? { renderSource: context.renderSource } : {}),
      ...(context.revalidateReason ? { revalidateReason: context.revalidateReason } : {}),
      ...(error && typeof error === "object" && "digest" in error
        ? { digest: String(error.digest) }
        : {}),
    });
    return;
  }

  console.error("[portfolio-web] Next.js edge request failed", {
    error,
    method: request.method,
    requestPath: request.path,
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
