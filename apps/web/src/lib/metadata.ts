import "@tanstack/react-start/server-only";
import { getSiteEnv } from "@portfolio/env/site";

export function getSiteUrl() {
  return getSiteEnv().siteUrl;
}
