import { z } from "zod";

import { parseEnv } from "#utils";

const optionalSecret = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

const langfuseServerSchema = z
  .object({
    LANGFUSE_PUBLIC_KEY: optionalSecret,
    LANGFUSE_SECRET_KEY: optionalSecret,
    LANGFUSE_BASE_URL: z.url().default("https://cloud.langfuse.com"),
  })
  .superRefine((environment, context) => {
    if (Boolean(environment.LANGFUSE_PUBLIC_KEY) === Boolean(environment.LANGFUSE_SECRET_KEY)) {
      return;
    }

    context.addIssue({
      code: "custom",
      message: "LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY must be configured together.",
      path: [environment.LANGFUSE_PUBLIC_KEY ? "LANGFUSE_SECRET_KEY" : "LANGFUSE_PUBLIC_KEY"],
    });
  });

export type LangfuseServerEnv = z.infer<typeof langfuseServerSchema>;

export function getLangfuseServerEnv(source: NodeJS.ProcessEnv = process.env) {
  const environment = parseEnv(langfuseServerSchema, source);
  const enabled = Boolean(environment.LANGFUSE_PUBLIC_KEY && environment.LANGFUSE_SECRET_KEY);

  return {
    enabled,
    publicKey: environment.LANGFUSE_PUBLIC_KEY,
    secretKey: environment.LANGFUSE_SECRET_KEY,
    baseUrl: environment.LANGFUSE_BASE_URL,
  } as const;
}
