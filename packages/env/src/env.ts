import { z } from "zod";
import { parseEnv } from "./utils";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = parseEnv(envSchema);
