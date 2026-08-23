import {
  type ChatCitation,
  countUserMessagesSince,
  createAssistantChatMessage,
  createOrTouchChatSession,
  createUserChatMessage,
  findChatMessageByProviderId,
  findChatSessionByKey,
  listRecentChatMessages,
  listStoredChatMessages,
} from "@portfolio/database";
import type { AskZomerMessage, QueryIntent } from "../../types";
import type { ConversationMessage } from "./types";

const MAX_CONTEXT_TOKENS = 6_000;
const MAX_HISTORY_MESSAGES = 30;
const MAX_STORED_HISTORY_MESSAGES = 50;
const SESSION_RATE_LIMIT_PER_MINUTE = 8;
const SESSION_RATE_LIMIT_PER_DAY = 120;

export class AssistantRateLimitError extends Error {
  constructor() {
    super("This chat has reached its request limit. Please wait before trying again.");
    this.name = "AssistantRateLimitError";
  }
}

function approximateTokenCount(value: string) {
  return Math.max(1, Math.ceil(value.length / 4));
}

export async function getOrCreateChatSession(sessionKey: string) {
  const session = await createOrTouchChatSession(sessionKey);
  if (!session) throw new Error("Chat session could not be created.");
  return session;
}

export async function enforceSessionRateLimit(sessionId: string) {
  const now = Date.now();
  const minuteAgo = new Date(now - 60_000);
  const dayAgo = new Date(now - 86_400_000);
  const [minute, day] = await Promise.all([
    countUserMessagesSince(sessionId, minuteAgo),
    countUserMessagesSince(sessionId, dayAgo),
  ]);

  if (minute >= SESSION_RATE_LIMIT_PER_MINUTE || day >= SESSION_RATE_LIMIT_PER_DAY) {
    throw new AssistantRateLimitError();
  }
}

export async function loadConversationMessages(sessionId: string): Promise<ConversationMessage[]> {
  const rows = await listRecentChatMessages(sessionId, MAX_HISTORY_MESSAGES);

  const selected: ConversationMessage[] = [];
  let tokenCount = 0;
  for (const row of rows) {
    const nextTokenCount = row.tokenCount || approximateTokenCount(row.content);
    if (selected.length > 0 && tokenCount + nextTokenCount > MAX_CONTEXT_TOKENS) break;
    tokenCount += nextTokenCount;
    selected.push(row);
  }

  return selected.reverse();
}

export async function saveUserMessage(options: {
  sessionId: string;
  providerMessageId: string;
  content: string;
  intent: QueryIntent;
}) {
  const created = await createUserChatMessage({
    ...options,
    tokenCount: approximateTokenCount(options.content),
  });

  if (created) return created;

  const existing = await findChatMessageByProviderId(options.providerMessageId);
  if (!existing || existing.sessionId !== options.sessionId || existing.role !== "user") {
    throw new Error("The message identifier is already in use.");
  }
  return existing;
}

export async function saveAssistantMessage(options: {
  sessionId: string;
  providerMessageId: string;
  content: string;
  intent: QueryIntent;
  model: string;
  citations: ChatCitation[];
  suggestions: string[];
}) {
  await createAssistantChatMessage({
    ...options,
    tokenCount: approximateTokenCount(options.content),
  });
}

export async function loadChatHistory(sessionKey: string): Promise<AskZomerMessage[]> {
  const session = await findChatSessionByKey(sessionKey);
  if (!session) return [];

  const rows = await listStoredChatMessages(session.id, MAX_STORED_HISTORY_MESSAGES);

  return rows.reverse().map((message) => {
    const metadata = {
      createdAt: message.createdAt.toISOString(),
      ...(message.intent ? { intent: message.intent } : {}),
      ...(message.model ? { model: message.model } : {}),
      sources: message.citations,
      suggestions: message.suggestions,
    };
    return {
      id: message.providerMessageId ?? message.id,
      role: message.role,
      parts: [{ type: "text" as const, text: message.content }],
      metadata,
    };
  });
}
