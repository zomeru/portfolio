import {
  countUserMessagesInWindows,
  createImportedChatMessage,
  findChatMessageByProviderId,
  findOrCreateChatSession,
  type ChatCitation,
} from "@portfolio/database";
import { getSiteEnv } from "@portfolio/env/site";

import type { AskZomerOfflineSyncMessage } from "../../types";

const MAX_OFFLINE_MESSAGE_AGE_MS = 365 * 24 * 60 * 60 * 1_000;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1_000;
const SESSION_RATE_LIMIT_PER_DAY = 120;

type OfflineSyncDependencies = {
  createMessage: typeof createImportedChatMessage;
  countUserMessages: typeof countUserMessagesInWindows;
  findMessage: typeof findChatMessageByProviderId;
  findOrCreateSession: typeof findOrCreateChatSession;
  now: () => number;
  siteOrigin: string;
};

const defaultDependencies: OfflineSyncDependencies = {
  createMessage: createImportedChatMessage,
  countUserMessages: countUserMessagesInWindows,
  findMessage: findChatMessageByProviderId,
  findOrCreateSession: findOrCreateChatSession,
  now: Date.now,
  siteOrigin: new URL(getSiteEnv().siteUrl).origin,
};

export class OfflineSyncConflictError extends Error {
  readonly messageId: string;

  constructor(messageId: string) {
    super("An offline message identifier is already associated with different content.");
    this.name = "OfflineSyncConflictError";
    this.messageId = messageId;
  }
}

export class OfflineSyncTimestampError extends Error {
  readonly messageId: string;

  constructor(messageId: string) {
    super("An offline message timestamp is outside the accepted synchronization window.");
    this.name = "OfflineSyncTimestampError";
    this.messageId = messageId;
  }
}

export class OfflineSyncRateLimitError extends Error {
  constructor() {
    super("This chat has reached its daily synchronization limit. Retry later.");
    this.name = "OfflineSyncRateLimitError";
  }
}

function approximateTokenCount(value: string) {
  return Math.max(1, Math.ceil(value.length / 4));
}

function safeCitations(
  sources: AskZomerOfflineSyncMessage["sources"],
  siteOrigin: string,
): ChatCitation[] {
  const citations: ChatCitation[] = [];
  const seen = new Set<string>();

  for (const source of sources ?? []) {
    if (source.sourceType === "web") continue;
    try {
      const url = new URL(source.url, siteOrigin);
      if (
        url.origin !== siteOrigin ||
        url.username ||
        url.password ||
        url.pathname.startsWith("/admin") ||
        url.pathname.startsWith("/api") ||
        /\/(?:blogs\/unsubscribe)\/?$/u.test(url.pathname)
      ) {
        continue;
      }
      url.hash = "";
      url.search = "";
      if (seen.has(url.href)) continue;
      seen.add(url.href);
      citations.push({ ...source, url: url.href });
    } catch {
      // Invalid offline citations are omitted without rejecting otherwise valid messages.
    }
  }
  return citations;
}

export async function synchronizeOfflineConversation(
  options: { messages: AskZomerOfflineSyncMessage[]; sessionKey: string },
  dependencies: OfflineSyncDependencies = defaultDependencies,
) {
  const session = await dependencies.findOrCreateSession(options.sessionKey);
  if (!session) throw new Error("Chat session could not be created.");

  const now = dependencies.now();
  const syncedMessageIds: string[] = [];
  for (const message of options.messages) {
    const createdAt = new Date(message.createdAt);
    const createdAtMs = createdAt.getTime();
    if (
      !Number.isFinite(createdAtMs) ||
      createdAtMs < now - MAX_OFFLINE_MESSAGE_AGE_MS ||
      createdAtMs > now + MAX_CLOCK_SKEW_MS
    ) {
      throw new OfflineSyncTimestampError(message.id);
    }

    if (message.role === "user" && !(await dependencies.findMessage(message.id))) {
      const counts = await dependencies.countUserMessages({
        sessionId: session.id,
        minuteSince: new Date(now - 60_000),
        daySince: new Date(now - 24 * 60 * 60 * 1_000),
      });
      if (counts.day >= SESSION_RATE_LIMIT_PER_DAY) throw new OfflineSyncRateLimitError();
    }

    const result = await dependencies.createMessage({
      sessionId: session.id,
      providerMessageId: message.id,
      role: message.role,
      content: message.content,
      intent: "portfolio",
      ...(message.role === "assistant"
        ? {
            citations: safeCitations(message.sources, dependencies.siteOrigin),
            model: message.model ?? "offline:webllm",
          }
        : {}),
      tokenCount: approximateTokenCount(message.content),
      createdAt,
    });
    if (result === "conflict") throw new OfflineSyncConflictError(message.id);
    syncedMessageIds.push(message.id);
  }

  return { syncedMessageIds };
}
