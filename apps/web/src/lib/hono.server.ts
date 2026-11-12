import "@tanstack/react-start/server-only";
import { apiApp } from "@portfolio/api";

import { workerContext } from "./worker-context.server";

export function fetchHono(input: RequestInfo | URL, init?: RequestInit) {
  const request = input instanceof Request && !init ? input : new Request(input, init);
  const runtime = workerContext.getStore();
  return apiApp.fetch(request, runtime?.env, runtime?.ctx);
}
