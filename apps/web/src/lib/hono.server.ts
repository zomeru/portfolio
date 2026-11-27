import "@tanstack/react-start/server-only";
import { workerContext } from "./worker-context.server";

export async function fetchHono(input: RequestInfo | URL, init?: RequestInit) {
  const request = input instanceof Request && !init ? input : new Request(input, init);
  const runtime = workerContext.getStore();
  const { apiApp } = await import("@portfolio/api");
  return apiApp.fetch(request, runtime?.env, runtime?.ctx);
}
