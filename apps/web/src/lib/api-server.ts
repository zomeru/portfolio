import "@tanstack/react-start/server-only";
import type { AppType } from "@portfolio/api/types";
import { hc } from "hono/client";

import { fetchHono } from "./hono.server";

const PLACEHOLDER_ORIGIN = "http://portfolio.internal";

export const serverClient = hc<AppType>(PLACEHOLDER_ORIGIN, {
  fetch: fetchHono,
});
