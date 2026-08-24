import { google } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { getAiServerEnv } from "@portfolio/env/ai-server";
import { getAssistantServerEnv } from "@portfolio/env/assistant-server";
import type { EmbeddingModel, LanguageModel } from "ai";

type AssistantProviderOptions = Record<string, Record<string, boolean | number | string>>;

type BlogLanguageModel = {
  model: LanguageModel;
  modelId: string;
  provider: string;
};

type AssistantModels = {
  chat: LanguageModel;
  chatGenerationOptions: {
    providerOptions?: AssistantProviderOptions;
    temperature: number;
  };
  chatModelId: string;
  documentEmbedding: EmbeddingModel;
  embeddingModelId: string;
  provider: "openrouter" | "nvidia" | "groq";
  queryEmbedding: EmbeddingModel;
};

export function getBlogLanguageModel(): BlogLanguageModel {
  const environment = getAiServerEnv();

  return {
    model: google(environment.blogModel),
    modelId: environment.blogModel,
    provider: "google",
  };
}

export const ASSISTANT_EMBEDDING_DIMENSIONS = 2048;

function requireProviderKey(value: string | undefined, provider: string) {
  if (!value) throw new Error(`${provider} API key is required for the selected chat provider.`);
  return value;
}

export function getAssistantModels(): AssistantModels {
  const environment = getAssistantServerEnv();
  const openrouter = createOpenRouter({ apiKey: environment.openrouterApiKey });
  const chatModels = {
    groq: () => ({
      generationOptions: {
        providerOptions: {
          groq: {
            reasoningEffort: "low",
            reasoningFormat: "hidden",
          },
        },
        temperature: 0.2,
      },
      model: createGroq({ apiKey: requireProviderKey(environment.groqApiKey, "Groq") })(
        environment.groqChatModel,
      ),
      modelId: environment.groqChatModel,
    }),
    nvidia: () => ({
      generationOptions: { temperature: 0.2 },
      model: createOpenAICompatible({
        name: "nvidia",
        apiKey: requireProviderKey(environment.nvidiaApiKey, "NVIDIA NIM"),
        baseURL: "https://integrate.api.nvidia.com/v1",
      }).chatModel(environment.nvidiaChatModel),
      modelId: environment.nvidiaChatModel,
    }),
    openrouter: () => ({
      generationOptions: { temperature: 0.2 },
      model: openrouter.chat(environment.openrouterChatModel),
      modelId: environment.openrouterChatModel,
    }),
  } satisfies Record<
    typeof environment.chatProvider,
    () => {
      generationOptions: { providerOptions?: AssistantProviderOptions; temperature: number };
      model: LanguageModel;
      modelId: string;
    }
  >;
  const chatModel = chatModels[environment.chatProvider]();
  const embeddingSettings = (inputType: "passage" | "query") => ({
    extraBody: { input_type: inputType },
    provider: { require_parameters: true },
  });

  return {
    chat: chatModel.model,
    chatGenerationOptions: chatModel.generationOptions,
    chatModelId: chatModel.modelId,
    documentEmbedding: openrouter.textEmbeddingModel(
      environment.embeddingModel,
      embeddingSettings("passage"),
    ),
    embeddingModelId: environment.embeddingModel,
    provider: environment.chatProvider,
    queryEmbedding: openrouter.textEmbeddingModel(
      environment.embeddingModel,
      embeddingSettings("query"),
    ),
  };
}
