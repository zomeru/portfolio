import { randomUUID } from "node:crypto";
import type { ChatCitation } from "@portfolio/database";
import {
  consumeStream,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type ModelMessage,
  streamText,
} from "ai";
import type { AskZomerMessage, QueryIntent } from "../../types";
import { getAssistantModels } from "../ai/models";
import {
  enforceSessionRateLimit,
  getOrCreateChatSession,
  loadConversationMessages,
  saveAssistantMessage,
  saveUserMessage,
} from "./conversation";
import { classifyQueryIntent } from "./intent";
import { buildAssistantSystemPrompt } from "./prompts";
import { searchPortfolioKnowledge } from "./retrieval";
import { createFollowUpSuggestions } from "./suggestions";
import { withAssistantSpan } from "./telemetry";

function textFromMessage(message: AskZomerMessage) {
  return message.parts
    .filter(
      (part): part is Extract<(typeof message.parts)[number], { type: "text" }> =>
        part.type === "text",
    )
    .map((part) => part.text)
    .join("")
    .trim();
}

function noEvidenceMessage(intent: string) {
  if (intent === "blog") {
    return "I couldn't find matching published blog content in Zomer's indexed portfolio, so I can't identify his latest post.";
  }
  if (intent === "experience") {
    return "I couldn't find matching work-experience evidence in Zomer's indexed portfolio.";
  }
  return "I couldn't find portfolio evidence that supports an answer to that question.";
}

function createNoEvidenceResponse(options: {
  content: string;
  intent: QueryIntent;
  model: string;
  sessionId: string;
  suggestions: string[];
}) {
  const textPartId = randomUUID();
  const metadata = {
    createdAt: new Date().toISOString(),
    intent: options.intent,
    model: options.model,
    sources: [],
    suggestions: options.suggestions,
  };
  const stream = createUIMessageStream<AskZomerMessage>({
    generateId: randomUUID,
    execute: ({ writer }) => {
      writer.write({ type: "start", messageMetadata: metadata });
      writer.write({ type: "text-start", id: textPartId });
      writer.write({ type: "text-delta", id: textPartId, delta: options.content });
      writer.write({ type: "text-end", id: textPartId });
      writer.write({ type: "finish", finishReason: "stop" });
    },
    onEnd: async ({ responseMessage, isAborted }) => {
      if (isAborted) return;
      await saveAssistantMessage({
        sessionId: options.sessionId,
        providerMessageId: responseMessage.id,
        content: options.content,
        intent: options.intent,
        model: options.model,
        citations: [],
        suggestions: options.suggestions,
      });
    },
  });

  return createUIMessageStreamResponse({ stream, consumeSseStream: consumeStream });
}

export async function createAssistantChatResponse(options: {
  sessionKey: string;
  messageId: string;
  text: string;
  abortSignal?: AbortSignal;
}) {
  const session = await getOrCreateChatSession(options.sessionKey);
  await enforceSessionRateLimit(session.id);
  const history = await loadConversationMessages(session.id);
  const classification = await withAssistantSpan(
    "ask-zomer.intent-classification",
    { "langfuse.session.id": options.sessionKey },
    async () => classifyQueryIntent(options.text, history),
  );
  const userMessage = await saveUserMessage({
    sessionId: session.id,
    providerMessageId: options.messageId,
    content: options.text,
    intent: classification.intent,
  });

  const retrieval =
    classification.intent === "general"
      ? { results: [], sources: [], embeddingFailed: false }
      : await withAssistantSpan(
          "ask-zomer.retrieval",
          {
            "langfuse.session.id": options.sessionKey,
            "ai.intent": classification.intent,
          },
          () =>
            searchPortfolioKnowledge({
              query: options.text,
              classification,
              sessionId: session.id,
              messageId: userMessage.id,
            }),
        );
  const suggestions = await withAssistantSpan(
    "ask-zomer.suggestion-generation",
    {
      "langfuse.session.id": options.sessionKey,
      "langfuse.observation.input.message_id": options.messageId,
      "ai.intent": classification.intent,
    },
    async () => createFollowUpSuggestions(classification, retrieval.results),
  );
  const models = getAssistantModels();
  if (classification.intent !== "general" && retrieval.results.length === 0) {
    return createNoEvidenceResponse({
      content: noEvidenceMessage(classification.intent),
      intent: classification.intent,
      model: models.chatModelId,
      sessionId: session.id,
      suggestions,
    });
  }

  const relevantHistory =
    classification.intent === "general"
      ? history
      : history.filter((message) => message.role === "user");
  const messages: ModelMessage[] = [
    ...relevantHistory.map(
      (message) => ({ role: message.role, content: message.content }) as ModelMessage,
    ),
    { role: "user", content: options.text },
  ];

  const result = streamText({
    model: models.chat,
    system: buildAssistantSystemPrompt(classification, retrieval.results),
    messages,
    maxOutputTokens: 900,
    maxRetries: 2,
    ...(options.abortSignal ? { abortSignal: options.abortSignal } : {}),
    runtimeContext: {
      sessionId: options.sessionKey,
      messageId: options.messageId,
      intent: classification.intent,
      retrievalCount: retrieval.results.length,
      model: models.chatModelId,
    },
    telemetry: {
      functionId: "ask-zomer.chat-generation",
      includeRuntimeContext: {
        sessionId: true,
        messageId: true,
        intent: true,
        retrievalCount: true,
        model: true,
      },
      recordInputs: false,
      recordOutputs: false,
    },
  });

  return result.toUIMessageStreamResponse<AskZomerMessage>({
    consumeSseStream: consumeStream,
    generateMessageId: randomUUID,
    sendReasoning: false,
    sendSources: false,
    messageMetadata: ({ part }) => {
      if (part.type !== "start") return undefined;
      return {
        createdAt: new Date().toISOString(),
        intent: classification.intent,
        model: models.chatModelId,
        sources: retrieval.sources,
        suggestions,
      };
    },
    onError: () => "Ask Zomer AI couldn't finish that response. Please try again.",
    onEnd: async ({ responseMessage, isAborted }) => {
      const content = textFromMessage(responseMessage);
      if (isAborted || !content) return;
      await saveAssistantMessage({
        sessionId: session.id,
        providerMessageId: responseMessage.id,
        content,
        intent: classification.intent,
        model: models.chatModelId,
        citations: retrieval.sources as ChatCitation[],
        suggestions,
      });
    },
  });
}
