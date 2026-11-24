import { z } from "zod";

import { parseEnv } from "#utils";

export const ASSISTANT_EMBEDDING = {
  model: "nvidia/nemotron-3.5-embed-8b:free",
  dimensions: 4096,
  indexVersion: "nemotron35-structural-v1",
} as const;

const embeddingSchema = z.object({
  OPENROUTER_API_KEY: z.string().trim().min(1, "OPENROUTER_API_KEY is required."),
  AI_EMBEDDING_MODEL: z.literal(ASSISTANT_EMBEDDING.model).default(ASSISTANT_EMBEDDING.model),
});

export function getEmbeddingEnv(source: NodeJS.ProcessEnv = process.env) {
  const environment = parseEnv(embeddingSchema, source);
  return { apiKey: environment.OPENROUTER_API_KEY, model: environment.AI_EMBEDDING_MODEL };
}
