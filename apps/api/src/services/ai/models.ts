import { google } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { getAiServerEnv } from "@portfolio/env/ai-server";
import { getAssistantServerEnv } from "@portfolio/env/assistant-server";
import type { EmbeddingModel, LanguageModel } from "ai";

type BlogLanguageModel = {
  model: LanguageModel;
  modelId: string;
  provider: string;
};

type AssistantModels = {
  chat: LanguageModel;
  chatModelId: string;
  embedding: EmbeddingModel;
  embeddingModelId: string;
  provider: "openrouter";
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

export function getAssistantModels(): AssistantModels {
  const environment = getAssistantServerEnv();
  const openrouter = createOpenRouter({ apiKey: environment.apiKey });

  return {
    chat: openrouter.chat(environment.chatModel),
    chatModelId: environment.chatModel,
    embedding: openrouter.textEmbeddingModel(environment.embeddingModel),
    embeddingModelId: environment.embeddingModel,
    provider: "openrouter",
  };
}
