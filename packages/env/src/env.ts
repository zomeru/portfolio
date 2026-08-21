import { z } from "zod";
import { parseEnv } from "./utils";

export const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DATABASE_DIRECT_URL: z.string().min(1).optional(),
    NEXT_PUBLIC_SITE_URL: z.url().min(1).optional(),
  })
  .transform((env) => ({
    ...env,
    NEXT_PUBLIC_SITE_URL:
      env.NEXT_PUBLIC_SITE_URL ??
      (env.NODE_ENV === "development" ? "http://localhost:3000" : undefined),
  }))
  .pipe(
    z.object({
      NODE_ENV: z.enum(["development", "production"]),
      DATABASE_URL: z.string(),
      DATABASE_DIRECT_URL: z.string().optional(),
      NEXT_PUBLIC_SITE_URL: z.url().min(1, "NEXT_PUBLIC_SITE_URL is required in production"),
    }),
  );

export type Env = z.infer<typeof envSchema>;

export const env: Env = parseEnv(envSchema);
