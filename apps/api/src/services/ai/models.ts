import { createGoogle } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { getAiServerEnv } from "@portfolio/env/ai-server";
import { getAssistantServerEnv } from "@portfolio/env/assistant-server";
import { getEmbeddingEnv } from "@portfolio/env/embedding";
import type { EmbeddingModel, LanguageModel, ToolSet } from "ai";

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
  provider: "openrouter" | "nvidia" | "groq";
  webSearchTools: ToolSet | undefined;
};

export function getBlogLanguageModel(): BlogLanguageModel {
  const environment = getAiServerEnv();

  return {
    model: createGoogle({ apiKey: environment.apiKey })(environment.blogModel),
    modelId: environment.blogModel,
    provider: "google",
  };
}

export function getEmbeddingModel(inputType: "passage" | "query"): EmbeddingModel {
  const { apiKey, model } = getEmbeddingEnv();
  return createOpenRouter({ apiKey }).textEmbeddingModel(model, {
    extraBody: { input_type: inputType },
    provider: { require_parameters: true },
  });
}

function requireProviderKey(value: string | undefined, provider: string) {
  if (!value) throw new Error(`${provider} API key is required for the selected chat provider.`);
  return value;
}

export function getAssistantModels(): AssistantModels {
  const environment = getAssistantServerEnv();

  const chatModels = {
    groq: () => {
      const groq = createGroq({ apiKey: requireProviderKey(environment.groqApiKey, "Groq") });
      return {
        generationOptions: {
          providerOptions: {
            groq: {
              reasoningEffort: "low",
              reasoningFormat: "hidden",
            },
          },
          temperature: 0.2,
        },
        model: groq(environment.groqChatModel),
        modelId: environment.groqChatModel,
        webSearchTools: { browser_search: groq.tools.browserSearch({}) },
      };
    },
    nvidia: () => ({
      generationOptions: { temperature: 0.2 },
      model: createOpenAICompatible({
        name: "nvidia",
        apiKey: requireProviderKey(environment.nvidiaApiKey, "NVIDIA NIM"),
        baseURL: "https://integrate.api.nvidia.com/v1",
      }).chatModel(environment.nvidiaChatModel),
      modelId: environment.nvidiaChatModel,
      webSearchTools: undefined,
    }),
    openrouter: () => {
      const openrouter = createOpenRouter({
        apiKey: requireProviderKey(environment.openrouterApiKey, "OpenRouter"),
      });
      return {
        generationOptions: { temperature: 0.2 },
        model: openrouter.chat(environment.openrouterChatModel),
        modelId: environment.openrouterChatModel,
        webSearchTools: {
          web_search: openrouter.tools.webSearch({ engine: "auto", maxResults: 5 }),
        },
      };
    },
  } satisfies Record<
    typeof environment.chatProvider,
    () => {
      generationOptions: { providerOptions?: AssistantProviderOptions; temperature: number };
      model: LanguageModel;
      modelId: string;
      webSearchTools: ToolSet | undefined;
    }
  >;
  const chatModel = chatModels[environment.chatProvider]();

  return {
    chat: chatModel.model,
    chatGenerationOptions: chatModel.generationOptions,
    chatModelId: chatModel.modelId,
    provider: environment.chatProvider,
    webSearchTools: chatModel.webSearchTools,
  };
}
