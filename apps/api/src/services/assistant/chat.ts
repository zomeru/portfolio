import { randomUUID } from "node:crypto";
import { observe, propagateAttributes, updateActiveObservation } from "@langfuse/tracing";
import { trace } from "@opentelemetry/api";
import {
  consumeStream,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type ModelMessage,
  streamText,
} from "ai";
import { logError } from "../../lib/log";
import type { AskZomerMessage, AskZomerSource, QueryIntent } from "../../types";
import { getAssistantModels } from "../ai/models";
import { normalizeCitationStream } from "./citations";
import {
  enforceSessionRateLimit,
  getOrCreateChatSession,
  loadConversationMessages,
  saveAssistantMessage,
  saveUserMessage,
} from "./conversation";
import { classifyQueryIntent } from "./intent";
import { buildAssistantSystemPrompt } from "./prompts";
import { createRetrievalQuery } from "./query";
import {
  createBlogCountMessage,
  createCompanyCountMessage,
  createExperienceBoundaryMessage,
  createFilteredBlogListMessage,
  createLatestBlogMessage,
  createOldestBlogListMessage,
  createRecentBlogListMessage,
} from "./responses";
import { searchPortfolioKnowledge } from "./retrieval";
import { createFollowUpSuggestions } from "./suggestions";
import { withAssistantSpan } from "./telemetry";
import type { RetrievedKnowledge } from "./types";

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

function webSourcesFromMessage(message: AskZomerMessage): AskZomerSource[] {
  const sources: AskZomerSource[] = [];
  const seenUrls = new Set<string>();

  for (const part of message.parts) {
    if (part.type !== "source-url") continue;

    try {
      const url = new URL(part.url);
      if (url.protocol !== "http:" && url.protocol !== "https:") continue;
      url.hash = "";
      const normalizedUrl = url.href;
      if (seenUrls.has(normalizedUrl)) continue;
      seenUrls.add(normalizedUrl);
      sources.push({
        id: part.sourceId,
        sourceType: "web",
        title: part.title?.trim() || url.hostname,
        url: normalizedUrl,
      });
    } catch {
      // Ignore malformed provider source URLs instead of persisting unsafe links.
    }
  }

  return sources;
}

function mergeSources(...sourceGroups: readonly (readonly AskZomerSource[])[]): AskZomerSource[] {
  const sources: AskZomerSource[] = [];
  const seenUrls = new Set<string>();

  for (const source of sourceGroups.flat()) {
    if (seenUrls.has(source.url)) continue;
    seenUrls.add(source.url);
    sources.push(source);
  }

  return sources;
}

function noEvidenceMessage(intent: string) {
  if (intent === "blog") {
    return "I couldn't find matching published blog evidence in Zomer's indexed portfolio.";
  }
  if (intent === "experience") {
    return "I couldn't find matching work-experience evidence in Zomer's indexed portfolio.";
  }
  return "I couldn't find portfolio evidence that supports an answer to that question.";
}

function metadataString(result: RetrievedKnowledge | undefined, key: string) {
  const value = result?.metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function metadataStringList(result: RetrievedKnowledge | undefined, key: string) {
  const value = result?.metadata[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : undefined;
}

function blogSummaries(results: readonly RetrievedKnowledge[], sources: readonly AskZomerSource[]) {
  const resultByDocument = new Map(results.map((result) => [result.documentId, result]));
  return sources.map((source) => {
    const publishedAt = metadataString(resultByDocument.get(source.id), "publishedAt");
    return {
      ...(publishedAt ? { publishedAt } : {}),
      title: source.title,
    };
  });
}

function createDeterministicResponse(options: {
  content: string;
  intent: QueryIntent;
  model: string;
  sessionId: string;
  sources?: AskZomerSource[];
  suggestions: string[];
}) {
  const textPartId = randomUUID();
  const metadata = {
    createdAt: new Date().toISOString(),
    intent: options.intent,
    model: options.model,
    sources: options.sources ?? [],
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
        citations: options.sources ?? [],
        suggestions: options.suggestions,
      });
    },
  });

  return createUIMessageStreamResponse({ stream, consumeSseStream: consumeStream });
}

async function createAssistantChatResponseImpl(options: {
  sessionKey: string;
  messageId: string;
  text: string;
  abortSignal?: AbortSignal;
}) {
  updateActiveObservation({ input: { messageCharacters: options.text.length } });

  return propagateAttributes(
    {
      traceName: "ask-zomer-chat",
      sessionId: options.sessionKey,
      tags: ["ask-zomer-ai"],
      metadata: { feature: "ask-zomer-ai" },
    },
    async () => {
      try {
        const session = await getOrCreateChatSession(options.sessionKey);
        await enforceSessionRateLimit(session.id);
        const history = await loadConversationMessages(session.id);
        const classification = await withAssistantSpan(
          "ask-zomer.intent-classification",
          { "langfuse.session.id": options.sessionKey },
          async () => classifyQueryIntent(options.text, history),
        );
        const retrievalQuery = createRetrievalQuery(options.text, classification, history);
        const userMessage = await saveUserMessage({
          sessionId: session.id,
          providerMessageId: options.messageId,
          content: options.text,
          intent: classification.intent,
        });

        const retrieval =
          classification.intent === "general"
            ? {
                aggregate: null,
                results: [],
                sources: [],
                embeddingFailed: false,
                evidence: {
                  foundNamedTerms: [],
                  kind: "none" as const,
                  missingNamedTerms: [],
                },
                resultLimit: 0,
                strategy: "none" as const,
              }
            : await withAssistantSpan(
                "ask-zomer.retrieval",
                {
                  "langfuse.session.id": options.sessionKey,
                  "ai.intent": classification.intent,
                },
                () =>
                  searchPortfolioKnowledge({
                    query: retrievalQuery,
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
        if (retrieval.aggregate?.kind === "blog-count") {
          const content = createBlogCountMessage(retrieval.aggregate.value);
          updateActiveObservation({ output: { responseCharacters: content.length } });
          trace.getActiveSpan()?.end();
          return createDeterministicResponse({
            content,
            intent: classification.intent,
            model: models.chatModelId,
            sessionId: session.id,
            suggestions,
          });
        }
        if (retrieval.aggregate?.kind === "company-count") {
          const content = createCompanyCountMessage(retrieval.aggregate.value);
          updateActiveObservation({ output: { responseCharacters: content.length } });
          trace.getActiveSpan()?.end();
          return createDeterministicResponse({
            content,
            intent: classification.intent,
            model: models.chatModelId,
            sessionId: session.id,
            suggestions,
          });
        }
        if (
          (retrieval.strategy === "recent-blogs" || retrieval.strategy === "oldest-blogs") &&
          retrieval.sources.length > 0
        ) {
          const summaries = blogSummaries(retrieval.results, retrieval.sources);
          const content =
            retrieval.strategy === "recent-blogs"
              ? createRecentBlogListMessage(summaries)
              : createOldestBlogListMessage(summaries);
          updateActiveObservation({ output: { responseCharacters: content.length } });
          trace.getActiveSpan()?.end();
          return createDeterministicResponse({
            content,
            intent: classification.intent,
            model: models.chatModelId,
            sessionId: session.id,
            sources: retrieval.sources,
            suggestions,
          });
        }
        if (
          (retrieval.strategy === "latest-blog" || retrieval.strategy === "oldest-blog") &&
          retrieval.sources[0]
        ) {
          const summary = blogSummaries(retrieval.results, [retrieval.sources[0]])[0];
          if (!summary) throw new Error("Structured blog retrieval returned no summary.");
          const content = createLatestBlogMessage(
            summary,
            retrieval.strategy === "latest-blog" ? "latest" : "oldest",
          );
          updateActiveObservation({ output: { responseCharacters: content.length } });
          trace.getActiveSpan()?.end();
          return createDeterministicResponse({
            content,
            intent: classification.intent,
            model: models.chatModelId,
            sessionId: session.id,
            sources: retrieval.sources,
            suggestions,
          });
        }
        if (
          (retrieval.strategy === "latest-experience" ||
            retrieval.strategy === "oldest-experience") &&
          retrieval.sources[0]
        ) {
          const source = retrieval.sources[0];
          const result = retrieval.results.find((candidate) => candidate.documentId === source.id);
          const company = metadataString(result, "company");
          const location = metadataString(result, "location");
          const period = metadataString(result, "period");
          const role = metadataString(result, "role");
          const technologies = metadataStringList(result, "technologies");
          const content = createExperienceBoundaryMessage(
            {
              ...(company ? { company } : {}),
              ...(location ? { location } : {}),
              ...(period ? { period } : {}),
              ...(role ? { role } : {}),
              ...(technologies ? { technologies } : {}),
              title: source.title,
            },
            retrieval.strategy === "latest-experience" ? "latest" : "oldest",
          );
          updateActiveObservation({ output: { responseCharacters: content.length } });
          trace.getActiveSpan()?.end();
          return createDeterministicResponse({
            content,
            intent: classification.intent,
            model: models.chatModelId,
            sessionId: session.id,
            sources: [source],
            suggestions,
          });
        }
        if (retrieval.strategy === "blog-filter-list") {
          const content = createFilteredBlogListMessage({
            blogs: blogSummaries(retrieval.results, retrieval.sources),
            terms: retrievalQuery.namedTerms,
            total:
              retrieval.aggregate?.kind === "blog-filter-count"
                ? retrieval.aggregate.value
                : retrieval.sources.length,
          });
          updateActiveObservation({ output: { responseCharacters: content.length } });
          trace.getActiveSpan()?.end();
          return createDeterministicResponse({
            content,
            intent: classification.intent,
            model: models.chatModelId,
            sessionId: session.id,
            sources: retrieval.sources,
            suggestions,
          });
        }
        const namedFactIsUnsupported =
          retrievalQuery.namedTerms.length === 1 &&
          retrieval.evidence.missingNamedTerms.length === retrievalQuery.namedTerms.length;
        if (
          classification.intent !== "general" &&
          (retrieval.results.length === 0 || namedFactIsUnsupported)
        ) {
          const content = noEvidenceMessage(classification.intent);
          updateActiveObservation({ output: { responseCharacters: content.length } });
          trace.getActiveSpan()?.end();
          return createDeterministicResponse({
            content,
            intent: classification.intent,
            model: models.chatModelId,
            sessionId: session.id,
            suggestions,
          });
        }

        const messages: ModelMessage[] = [
          ...history.map(
            (message) => ({ role: message.role, content: message.content }) as ModelMessage,
          ),
          { role: "user", content: options.text },
        ];
        const webSearchTools =
          classification.intent === "general" ? models.webSearchTools : undefined;

        const result = streamText({
          model: models.chat,
          system: buildAssistantSystemPrompt(classification, retrieval.results, {
            resultLimit: retrieval.resultLimit,
            strategy: retrieval.strategy,
            webSearchEnabled: Boolean(webSearchTools),
          }),
          messages,
          maxOutputTokens: 900,
          maxRetries: 2,
          ...models.chatGenerationOptions,
          ...(webSearchTools ? { toolChoice: "auto" as const, tools: webSearchTools } : {}),
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
          ...(classification.intent === "general"
            ? {}
            : { experimental_transform: normalizeCitationStream(retrieval.sources.length) }),
          onEnd: ({ text }) => {
            updateActiveObservation({ output: { responseCharacters: text.length } });
            trace.getActiveSpan()?.end();
          },
          onError: ({ error }) => {
            logError("assistant model stream failed", error, {
              operation: "assistant.streamModelResponse",
              sessionId: session.id,
              messageId: options.messageId,
              model: models.chatModelId,
              intent: classification.intent,
            });
            updateActiveObservation({
              level: "ERROR",
              output: { errorType: error instanceof Error ? error.name : "UnknownError" },
              statusMessage: "Zomer AI generation failed.",
            });
            trace.getActiveSpan()?.end();
          },
          onAbort: () => {
            updateActiveObservation({
              output: { aborted: true },
              statusMessage: "Zomer AI generation was stopped.",
            });
            trace.getActiveSpan()?.end();
          },
        });

        return result.toUIMessageStreamResponse<AskZomerMessage>({
          consumeSseStream: consumeStream,
          generateMessageId: randomUUID,
          sendReasoning: false,
          sendSources: true,
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
          onError: (error) => {
            logError("assistant UI message stream failed", error, {
              operation: "assistant.streamUiMessage",
              sessionId: session.id,
              messageId: options.messageId,
              model: models.chatModelId,
              intent: classification.intent,
            });
            return "Zomer AI couldn't finish that response. Please try again.";
          },
          onEnd: async ({ responseMessage, isAborted }) => {
            const content = textFromMessage(responseMessage);
            if (isAborted || !content) return;
            const citations = mergeSources(
              retrieval.sources,
              webSourcesFromMessage(responseMessage),
            );
            await saveAssistantMessage({
              sessionId: session.id,
              providerMessageId: responseMessage.id,
              content,
              intent: classification.intent,
              model: models.chatModelId,
              citations,
              suggestions,
            });
          },
        });
      } catch (error) {
        logError("assistant request setup failed", error, {
          operation: "assistant.createChatResponse",
          sessionKey: options.sessionKey,
          messageId: options.messageId,
        });
        updateActiveObservation({
          level: "ERROR",
          output: { errorType: error instanceof Error ? error.name : "UnknownError" },
          statusMessage: "Zomer AI request failed.",
        });
        trace.getActiveSpan()?.end();
        throw error;
      }
    },
  );
}

export const createAssistantChatResponse = observe(createAssistantChatResponseImpl, {
  name: "ask-zomer-chat",
  captureInput: false,
  captureOutput: false,
  endOnExit: false,
});
