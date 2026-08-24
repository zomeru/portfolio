import { z } from "zod";
import { parseEnv } from "#utils";

const AI_CHAT_PROVIDERS = ["nvidia", "openrouter", "groq"] as const;
const aiProviders = z.enum(AI_CHAT_PROVIDERS);
const DEFAULT_AI_CHAT_PROVIDER = "groq";

const DEFAULT_EMBEDDING_MODEL = "nvidia/nemotron-3-embed-1b:free"; // Openrouter

const DEFAULT_OPENROUTER_CHAT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const DEFAULT_NVIDIA_NIM_CHAT_MODEL = "deepseek-ai/deepseek-v4-flash-0731";
const DEFAULT_GROQ_CHAT_MODEL = "openai/gpt-oss-120b";

const assistantServerSchema = z
  .object({
    AI_INDEX_SECRET_KEY: z
      .string()
      .min(32, "AI_INDEX_SECRET_KEY must contain at least 32 characters."),
    AI_CHAT_PROVIDER: aiProviders.default(DEFAULT_AI_CHAT_PROVIDER),
    OPENROUTER_API_KEY: z.string().trim().min(1, "OPENROUTER_API_KEY is required."),
    NVIDIA_NIM_API_KEY: z.string().trim().min(1).optional(),
    GROQ_API_KEY: z.string().trim().min(1).optional(),

    AI_EMBEDDING_MODEL: z.string().trim().min(1).default(DEFAULT_EMBEDDING_MODEL),
    AI_OPENROUTER_CHAT_MODEL: z.string().trim().min(1).default(DEFAULT_OPENROUTER_CHAT_MODEL),
    AI_NVIDIA_NIM_CHAT_MODEL: z.string().trim().min(1).default(DEFAULT_NVIDIA_NIM_CHAT_MODEL),
    AI_GROQ_CHAT_MODEL: z.string().trim().min(1).default(DEFAULT_GROQ_CHAT_MODEL),
  })
  .superRefine((environment, context) => {
    if (environment.AI_CHAT_PROVIDER === "nvidia" && !environment.NVIDIA_NIM_API_KEY) {
      context.addIssue({
        code: "custom",
        message: "NVIDIA_NIM_API_KEY is required when AI_CHAT_PROVIDER is nvidia.",
        path: ["NVIDIA_NIM_API_KEY"],
      });
    }
    if (environment.AI_CHAT_PROVIDER === "groq" && !environment.GROQ_API_KEY) {
      context.addIssue({
        code: "custom",
        message: "GROQ_API_KEY is required when AI_CHAT_PROVIDER is groq.",
        path: ["GROQ_API_KEY"],
      });
    }
  });

export type AssistantServerEnv = z.infer<typeof assistantServerSchema>;

export function getAssistantServerEnv(source: NodeJS.ProcessEnv = process.env) {
  const environment = parseEnv(assistantServerSchema, source);

  return {
    aiIndexSecretKey: environment.AI_INDEX_SECRET_KEY,
    chatProvider: environment.AI_CHAT_PROVIDER,
    openrouterApiKey: environment.OPENROUTER_API_KEY,
    nvidiaApiKey: environment.NVIDIA_NIM_API_KEY,
    groqApiKey: environment.GROQ_API_KEY,
    embeddingModel: environment.AI_EMBEDDING_MODEL,
    openrouterChatModel: environment.AI_OPENROUTER_CHAT_MODEL,
    nvidiaChatModel: environment.AI_NVIDIA_NIM_CHAT_MODEL,
    groqChatModel: environment.AI_GROQ_CHAT_MODEL,
  } as const;
}
