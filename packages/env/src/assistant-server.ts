import { z } from "zod";
import { parseEnv } from "#utils";

const DEFAULT_CHAT_MODEL = "thinkingmachines/inkling-small:free";
const DEFAULT_EMBEDDING_MODEL = "nvidia/nemotron-3-embed-1b:free";

const assistantServerSchema = z.object({
  OPENROUTER_API_KEY: z.string().trim().min(1, "OPENROUTER_API_KEY is required."),
  AI_CHAT_MODEL: z.string().trim().min(1).default(DEFAULT_CHAT_MODEL),
  AI_EMBEDDING_MODEL: z.string().trim().min(1).default(DEFAULT_EMBEDDING_MODEL),
});

export type AssistantServerEnv = z.infer<typeof assistantServerSchema>;

export function getAssistantServerEnv(source: NodeJS.ProcessEnv = process.env) {
  const environment = parseEnv(assistantServerSchema, source);

  return {
    apiKey: environment.OPENROUTER_API_KEY,
    chatModel: environment.AI_CHAT_MODEL,
    embeddingModel: environment.AI_EMBEDDING_MODEL,
  } as const;
}
