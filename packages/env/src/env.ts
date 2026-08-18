import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
});

export type Env = z.infer<typeof envSchema>;

function formatError(error: z.ZodError<Env>): string {
  const issues = error.issues
    .map((issue) => {
      const path = issue.path.join(".") || "(root)";

      return `  - ${path}: ${issue.message}`;
    })
    .join("\n");

  return `Invalid environment variables:\n${issues}`;
}

export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    throw new Error(formatError(result.error));
  }

  return result.data;
}

export const env: Env = parseEnv();
