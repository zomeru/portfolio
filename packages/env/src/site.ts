import { z } from "zod";

import { parseEnv } from "#utils";

const siteSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    SITE_URL: z.url().optional(),
  })
  .transform((environment) => ({
    nodeEnv: environment.NODE_ENV,
    siteUrl:
      environment.SITE_URL ??
      (environment.NODE_ENV === "development" ? "http://localhost:3000" : undefined),
  }))
  .pipe(
    z.object({
      nodeEnv: z.enum(["development", "production"]),
      siteUrl: z.url("SITE_URL is required in production."),
    }),
  );

export type SiteEnv = z.infer<typeof siteSchema>;

export function getSiteEnv(source: NodeJS.ProcessEnv = process.env) {
  return parseEnv(siteSchema, source);
}
