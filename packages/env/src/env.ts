import { z } from "zod";
import { parseEnv } from "./utils";

export const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    VERCEL_URL: z.string().min(1).optional(),
  })
  .transform((env) => ({
    ...env,
    VERCEL_URL: env.VERCEL_URL ?? (env.NODE_ENV === "development" ? "localhost:3000" : undefined),
  }))
  .pipe(
    z.object({
      NODE_ENV: z.enum(["development", "production"]),
      DATABASE_URL: z.string(),
      VERCEL_URL: z.string().min(1, "VERCEL_URL is required in production"),
    }),
  );

export type Env = z.infer<typeof envSchema>;

export const env: Env = parseEnv(envSchema);
