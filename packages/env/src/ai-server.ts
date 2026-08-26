import { z } from "zod";

import { parseEnv } from "#utils";

const aiServerSchema = z.object({
  GOOGLE_GENERATIVE_AI_API_KEY: z
    .string()
    .trim()
    .min(1, "GOOGLE_GENERATIVE_AI_API_KEY is required."),
  GOOGLE_GENERATIVE_AI_MODEL: z
    .string()
    .trim()
    .regex(/^gemini-[a-z0-9][a-z0-9._-]*$/i, "Use a Google Gemini model identifier."),
});

export type AiServerEnv = z.infer<typeof aiServerSchema>;

export function getAiServerEnv(source: NodeJS.ProcessEnv = process.env) {
  const environment = parseEnv(aiServerSchema, source);
  return {
    apiKey: environment.GOOGLE_GENERATIVE_AI_API_KEY,
    blogModel: environment.GOOGLE_GENERATIVE_AI_MODEL,
  } as const;
}
