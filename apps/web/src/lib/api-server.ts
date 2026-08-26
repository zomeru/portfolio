import "server-only";
import { apiApp } from "@portfolio/api";
import type { AppType } from "@portfolio/api/types";
import { hc } from "hono/client";

const PLACEHOLDER_ORIGIN = "http://portfolio.internal";

export const serverClient = hc<AppType>(PLACEHOLDER_ORIGIN, {
  fetch: apiApp.request.bind(apiApp),
});
