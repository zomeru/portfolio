import { google } from "@ai-sdk/google";
import { getAiServerEnv } from "@portfolio/env/ai-server";
import type { LanguageModel } from "ai";

type BlogLanguageModel = {
  model: LanguageModel;
  modelId: string;
  provider: string;
};

export function getBlogLanguageModel(): BlogLanguageModel {
  const environment = getAiServerEnv();

  return {
    model: google(environment.blogModel),
    modelId: environment.blogModel,
    provider: "google",
  };
}
