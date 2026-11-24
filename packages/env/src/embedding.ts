import { z } from "zod";

import { parseEnv } from "#utils";

export const ASSISTANT_EMBEDDING = {
  model: "nvidia/nemotron-3.5-embed-8b:free",
  nvidiaModel: "nvidia/nemotron-3.5-embed-8b",
  nvidiaDeployedModel: "nvidia/Nemotron-3.5-Embed-8B-BF16",
  dimensions: 4096,
  indexVersion: "nemotron35-structural-v1",
} as const;

const embeddingSchema = z.object({
  OPENROUTER_API_KEY: z.string().trim().min(1, "OPENROUTER_API_KEY is required."),
  AI_EMBEDDING_MODEL: z.literal(ASSISTANT_EMBEDDING.model).default(ASSISTANT_EMBEDDING.model),
});

const nvidiaEmbeddingSchema = z.object({
  NVIDIA_NIM_API_KEY: z.string().trim().min(1, "NVIDIA_NIM_API_KEY is required."),
  NVIDIA_NIM_EMBEDDING_URL: z.url({ protocol: /^https$/ }).optional(),
});

const NVIDIA_HOSTED_EMBEDDING_URL = "https://integrate.api.nvidia.com/v1/embeddings";

export function getEmbeddingEnv(source: NodeJS.ProcessEnv = process.env) {
  const environment = parseEnv(embeddingSchema, source);
  return { apiKey: environment.OPENROUTER_API_KEY, model: environment.AI_EMBEDDING_MODEL };
}

export function getNvidiaEmbeddingEnv(source: NodeJS.ProcessEnv = process.env) {
  const environment = parseEnv(nvidiaEmbeddingSchema, source);
  const endpoint = environment.NVIDIA_NIM_EMBEDDING_URL ?? NVIDIA_HOSTED_EMBEDDING_URL;
  return {
    apiKey: environment.NVIDIA_NIM_API_KEY,
    endpoint,
    model:
      endpoint === NVIDIA_HOSTED_EMBEDDING_URL
        ? ASSISTANT_EMBEDDING.nvidiaModel
        : ASSISTANT_EMBEDDING.nvidiaDeployedModel,
  };
}
