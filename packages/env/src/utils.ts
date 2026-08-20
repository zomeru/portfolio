import type z from "zod";

function formatError<T>(error: z.ZodError<T>): string {
  const issues = error.issues
    .map((issue) => {
      const path = issue.path.join(".") || "(root)";

      return `  - ${path}: ${issue.message}`;
    })
    .join("\n");

  return `Invalid environment variables:\n${issues}`;
}

export function parseEnv<T>(schema: z.ZodType<T>, source: NodeJS.ProcessEnv = process.env): T {
  const result = schema.safeParse(source);

  if (!result.success) {
    throw new Error(formatError(result.error));
  }

  return result.data;
}
