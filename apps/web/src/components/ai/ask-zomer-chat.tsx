"use client";

import { useChat } from "@ai-sdk/react";
import type { AskZomerHistoryPage, AskZomerMessage, AskZomerSource } from "@portfolio/api/types";
import { DefaultChatTransport, getToolName, isToolUIPart } from "ai";
import { ArrowDown, ArrowUp, Globe2, LoaderCircle, RefreshCw, Square } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import "@/components/portfolio/markdown-content.css";
import { NETWORK_AVAILABLE_EVENT, useNetworkStatus } from "@/components/pwa/network-status";
import { client } from "@/lib/api";
import { reportClientWarning } from "@/lib/client-log";
import { selectAssistantMode } from "@/lib/offline/assistant-mode";
import {
  cacheServerMessages,
  getCachedMessages,
  getOfflineKnowledge,
  putLocalMessage,
  setOfflineModelState,
} from "@/lib/offline/chat-database";
import { retrieveOfflineKnowledge } from "@/lib/offline/knowledge";
import { synchronizePendingMessages } from "@/lib/offline/sync";
import { classifyRequestFailure, HttpRequestError } from "@/lib/request-failure";

const SESSION_STORAGE_KEY = "ask-zomer-session";
const OUTBOX_SYNC_TAG = "zomer-chat-outbox";
const OfflineAiManager = dynamic(
  () => import("./offline-ai-manager").then((module) => module.OfflineAiManager),
  { ssr: false },
);

function compareMessages(left: AskZomerMessage, right: AskZomerMessage) {
  const leftDate = left.metadata?.createdAt ?? "";
  const rightDate = right.metadata?.createdAt ?? "";
  return leftDate.localeCompare(rightDate) || left.id.localeCompare(right.id);
}

function mergeMessages(...groups: AskZomerMessage[][]) {
  const messages = new Map<string, AskZomerMessage>();
  for (const message of groups.flat()) messages.set(message.id, message);
  return [...messages.values()].sort(compareMessages);
}

function createTextMessage(options: {
  content: string;
  createdAt?: string;
  id?: string;
  metadata?: Omit<NonNullable<AskZomerMessage["metadata"]>, "createdAt"> & {
    createdAt?: string;
  };
  role: "assistant" | "user";
}): AskZomerMessage {
  const createdAt = options.createdAt ?? new Date().toISOString();
  return {
    id: options.id ?? crypto.randomUUID(),
    role: options.role,
    parts: [{ type: "text", text: options.content }],
    metadata: { createdAt, ...options.metadata },
  };
}

async function requestBackgroundSync() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const syncRegistration = registration as ServiceWorkerRegistration & {
    sync?: { register: (tag: string) => Promise<void> };
  };
  await syncRegistration.sync?.register(OUTBOX_SYNC_TAG);
}
function getOrCreateSessionKey() {
  const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (stored) return stored;
  const sessionKey = crypto.randomUUID();
  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionKey);
  return sessionKey;
}

function messageText(message: AskZomerMessage) {
  return message.parts
    .filter(
      (part): part is Extract<(typeof message.parts)[number], { type: "text" }> =>
        part.type === "text",
    )
    .map((part) => part.text)
    .join("");
}

type WebSearchState = "complete" | "error" | "searching";
const WEB_SEARCH_TOOL_NAMES = new Set(["browser_search", "web_search"]);

function webSearchState(
  message: AskZomerMessage,
  isStreaming: boolean,
): WebSearchState | undefined {
  let toolInvoked = false;
  let completed = false;
  let failed = false;

  for (const part of message.parts) {
    if (!isToolUIPart(part) || !WEB_SEARCH_TOOL_NAMES.has(getToolName(part))) continue;
    toolInvoked = true;
    if (part.state === "output-error") failed = true;
    if (part.state === "output-available") completed = true;
  }

  if (failed) return "error";
  if (completed) return "complete";
  if (toolInvoked) return isStreaming ? "searching" : "complete";
  if (message.metadata?.webSearch) return "complete";
  return undefined;
}

function messageSources(message: AskZomerMessage): AskZomerSource[] {
  const sources: AskZomerSource[] = [];
  const seenUrls = new Set<string>();

  for (const source of message.metadata?.sources ?? []) {
    try {
      const url = new URL(source.url, window.location.origin);
      if (url.protocol !== "http:" && url.protocol !== "https:") continue;
      url.hash = "";
      if (seenUrls.has(url.href)) continue;
      seenUrls.add(url.href);
      sources.push({ ...source, url: url.href });
    } catch {
      // Ignore malformed cached or persisted source URLs.
    }
  }

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
      // Ignore malformed provider source URLs instead of rendering unsafe links.
    }
  }

  return sources;
}

function WebSearchStatus({ state }: { state: WebSearchState }) {
  const t = useTranslations("Assistant");
  const searching = state === "searching";
  return (
    <p
      className="mb-3 inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-xs text-muted"
      aria-busy={searching}
    >
      {searching ? (
        <LoaderCircle
          aria-hidden="true"
          className="size-3.5 animate-spin motion-reduce:animate-none"
        />
      ) : (
        <Globe2 aria-hidden="true" className="size-3.5" />
      )}
      {searching
        ? t("searchingWeb")
        : state === "complete"
          ? t("searchedWeb")
          : t("webUnavailable")}
    </p>
  );
}

function SourceList({ sources }: { sources: AskZomerSource[] }) {
  const t = useTranslations("Assistant");
  if (sources.length === 0) return null;

  return (
    <details className="mt-3 pt-3 text-xs text-muted">
      <summary className="w-fit cursor-pointer rounded-sm py-1 font-mono uppercase tracking-widest hover:text-foreground">
        {t("sourceCount", { count: sources.length })}
      </summary>
      <ol className="mt-2 space-y-2">
        {sources.map((source, index) => (
          <li key={`${source.sourceType}:${source.id}:${source.url}`} className="flex gap-2">
            <span aria-hidden="true" className="font-mono">
              [{index + 1}]
            </span>
            <a
              href={source.url}
              className="underline decoration-border underline-offset-4 hover:text-foreground"
            >
              {source.title}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}

function SuggestionList({
  disabled,
  onSelect,
  suggestions,
}: {
  disabled: boolean;
  onSelect: (suggestion: string) => void;
  suggestions: readonly string[];
}) {
  const t = useTranslations("Assistant");
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">{t("suggestedQuestions")}</legend>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(suggestion)}
          className="min-h-11 rounded-full border border-border px-3 py-2 text-left text-xs leading-snug text-muted transition-colors duration-150 hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
        >
          {suggestion}
        </button>
      ))}
    </fieldset>
  );
}

function ChatMessages({
  busy,
  hasOlderMessages,
  historyError,
  historyLoading,
  loading,
  messages,
  onLoadOlder,
}: {
  busy: boolean;
  hasOlderMessages: boolean;
  historyError: boolean;
  historyLoading: boolean;
  loading: boolean;
  messages: AskZomerMessage[];
  onLoadOlder: () => Promise<void>;
}) {
  const t = useTranslations("Assistant");
  const viewportRef = useRef<HTMLDivElement>(null);
  const initialPositionedRef = useRef(false);
  const nearBottomRef = useRef(true);
  const prependSnapshotRef = useRef<{ height: number; top: number } | null>(null);
  const previousFirstIdRef = useRef<string | undefined>(undefined);
  const previousLastSignatureRef = useRef<string | undefined>(undefined);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const firstMessageId = messages[0]?.id;
  const lastMessage = messages.at(-1);
  const lastMessageSignature = lastMessage
    ? `${lastMessage.id}:${messageText(lastMessage).length}:${lastMessage.parts.length}`
    : undefined;

  const scrollToLatest = useCallback((behavior: ScrollBehavior = "smooth") => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    nearBottomRef.current = true;
    setShowJumpToLatest(false);
  }, []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || loading) return;

    if (!initialPositionedRef.current) {
      initialPositionedRef.current = true;
      viewport.scrollTop = viewport.scrollHeight;
      previousFirstIdRef.current = firstMessageId;
      previousLastSignatureRef.current = lastMessageSignature;
      return;
    }

    const prepended =
      prependSnapshotRef.current !== null && previousFirstIdRef.current !== firstMessageId;
    if (prepended) {
      const snapshot = prependSnapshotRef.current;
      if (snapshot) {
        viewport.scrollTop = snapshot.top + (viewport.scrollHeight - snapshot.height);
      }
      prependSnapshotRef.current = null;
    } else if (previousLastSignatureRef.current !== lastMessageSignature) {
      if (nearBottomRef.current) {
        viewport.scrollTop = viewport.scrollHeight;
      } else {
        setShowJumpToLatest(true);
      }
    }

    previousFirstIdRef.current = firstMessageId;
    previousLastSignatureRef.current = lastMessageSignature;
  }, [firstMessageId, lastMessageSignature, loading]);

  const loadOlder = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || historyLoading || !hasOlderMessages) return;
    prependSnapshotRef.current = { height: viewport.scrollHeight, top: viewport.scrollTop };
    void onLoadOlder();
  }, [hasOlderMessages, historyLoading, onLoadOlder]);

  return (
    <div className="relative">
      <div
        ref={viewportRef}
        aria-live="polite"
        aria-relevant="additions text"
        className="chat-scrollbar max-h-[min(65dvh,44rem)] min-h-72 overflow-y-auto overscroll-contain py-6 pr-1"
        onScroll={(event) => {
          const viewport = event.currentTarget;
          const distanceFromBottom =
            viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
          nearBottomRef.current = distanceFromBottom < 96;
          if (nearBottomRef.current) setShowJumpToLatest(false);
          if (
            initialPositionedRef.current &&
            viewport.scrollHeight > viewport.clientHeight &&
            viewport.scrollTop < 192
          ) {
            loadOlder();
          }
        }}
      >
        {loading ? (
          <div
            role="status"
            aria-busy="true"
            className="flex items-center justify-center gap-2 py-10 text-sm text-muted sm:py-14"
          >
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
            {t("loadingMessages")}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-center sm:py-14">
            <div className="max-w-md">
              <p className="text-sm font-medium">{t("emptyTitle")}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t("emptyDescription")}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5 flex min-h-8 items-center justify-center text-xs text-muted">
              {historyLoading ? (
                <span role="status" className="inline-flex items-center gap-2">
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-3.5 animate-spin motion-reduce:animate-none"
                  />
                  {t("loadingOlderMessages")}
                </span>
              ) : historyError ? (
                <button
                  type="button"
                  onClick={loadOlder}
                  className="min-h-10 rounded-md border border-border px-3 hover:border-foreground hover:text-foreground"
                >
                  {t("retryOlderMessages")}
                </button>
              ) : hasOlderMessages ? (
                <button
                  type="button"
                  onClick={loadOlder}
                  className="min-h-10 rounded-md px-3 hover:text-foreground"
                >
                  {t("loadOlderMessages")}
                </button>
              ) : (
                <span>{t("beginningOfConversation")}</span>
              )}
            </div>
            <div className="space-y-5">
              {messages.map((message, index) => {
                const text = messageText(message);
                const sources = messageSources(message);
                const isLatestAssistant =
                  message.role === "assistant" && index === messages.length - 1;
                const searchState = isLatestAssistant ? webSearchState(message, busy) : undefined;
                return (
                  <article
                    key={message.id}
                    className={
                      message.role === "user"
                        ? "chat-message-user ml-auto max-w-[88%] rounded-2xl rounded-br-sm border border-border bg-chat-user-surface px-4 py-3 text-sm leading-relaxed text-foreground sm:max-w-[72%]"
                        : "chat-message-assistant max-w-2xl"
                    }
                  >
                    <p className="sr-only">{message.role === "user" ? t("you") : t("assistant")}</p>
                    {message.role === "assistant" && searchState ? (
                      <WebSearchStatus state={searchState} />
                    ) : null}
                    {message.role === "assistant" ? (
                      <div className="markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{text}</p>
                    )}
                    {message.role === "assistant" ? <SourceList sources={sources} /> : null}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
      {showJumpToLatest ? (
        <button
          type="button"
          onClick={() => scrollToLatest()}
          className="absolute right-3 bottom-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-background/95 px-3 text-xs shadow-lg backdrop-blur hover:border-foreground"
        >
          <ArrowDown aria-hidden="true" size={14} />
          {t("jumpToLatest")}
        </button>
      ) : null}
    </div>
  );
}

function ChatSession({
  initialQuestion,
  sessionKey,
}: {
  initialQuestion: string | undefined;
  sessionKey: string;
}) {
  const locale = useLocale();
  const t = useTranslations("Assistant");
  const tRequest = useTranslations("Errors.request");
  const { isOffline } = useNetworkStatus();
  const [input, setInput] = useState("");
  const [historyReady, setHistoryReady] = useState(false);
  const [historyWarning, setHistoryWarning] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [nextHistoryCursor, setNextHistoryCursor] = useState<string | null>(null);
  const [offlineModelInstalled, setOfflineModelInstalled] = useState(false);
  const [localBusy, setLocalBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const [syncStatus, setSyncStatus] = useState<"failed" | "idle" | "synced" | "syncing">("idle");
  const historyLoadingRef = useRef(false);
  const historyRequestControllerRef = useRef<AbortController | null>(null);
  const initialQuestionHandled = useRef(false);
  const localAbortRequestedRef = useRef(false);
  const onlinePendingIdRef = useRef<string | null>(null);
  const submissionRunningRef = useRef(false);
  const syncRunningRef = useRef(false);
  const syncOwnerIdRef = useRef(crypto.randomUUID());
  const transport = useMemo(
    () =>
      new DefaultChatTransport<AskZomerMessage>({
        api: "/api/ai/chat",
        prepareSendMessagesRequest: ({ messages }) => {
          const message = [...messages].reverse().find((item) => item.role === "user");
          return { body: { sessionKey, message } };
        },
      }),
    [sessionKey],
  );
  const { clearError, error, messages, regenerate, sendMessage, setMessages, status, stop } =
    useChat<AskZomerMessage>({
      id: sessionKey,
      transport,
      throttle: 50,
      onFinish: ({ isAbort, isDisconnect, isError, message, messages: finishedMessages }) => {
        const userMessageId = onlinePendingIdRef.current;
        onlinePendingIdRef.current = null;
        if (isAbort || isDisconnect || isError) return;
        if (userMessageId) {
          const userMessage = finishedMessages.find((candidate) => candidate.id === userMessageId);
          if (userMessage) {
            void putLocalMessage(sessionKey, userMessage, "synced").catch(
              (persistenceError: unknown) => {
                reportClientWarning("assistant.persistFinishedUser", persistenceError, {
                  sessionKey,
                });
              },
            );
          }
        }
        void putLocalMessage(sessionKey, message, "synced").catch((persistenceError: unknown) => {
          reportClientWarning("assistant.persistFinishedAssistant", persistenceError, {
            sessionKey,
          });
        });
      },
    });
  const remoteBusy = status === "submitted" || status === "streaming";
  const busy = remoteBusy || localBusy;
  const assistantMode = selectAssistantMode(isOffline, offlineModelInstalled);

  useEffect(() => {
    const controller = new AbortController();
    setHistoryReady(false);
    setHistoryWarning(false);
    setHistoryError(false);
    setNextHistoryCursor(null);
    async function restoreHistory() {
      let cachedMessages: AskZomerMessage[] = [];
      try {
        cachedMessages = (await getCachedMessages(sessionKey)).map((record) => record.message);
        if (!controller.signal.aborted && cachedMessages.length > 0) setMessages(cachedMessages);
        if (isOffline) return;
        const response = await client.api.ai.sessions[":sessionKey"].messages.$get(
          { param: { sessionKey }, query: {} },
          { init: { signal: controller.signal } },
        );
        if (!response.ok) throw new HttpRequestError(response.status);
        const payload = (await (response as Response).json()) as AskZomerHistoryPage;
        await cacheServerMessages(sessionKey, payload.messages);
        const localMessages = (await getCachedMessages(sessionKey)).map((record) => record.message);
        setMessages(mergeMessages(payload.messages, localMessages));
        setNextHistoryCursor(payload.nextCursor);
      } catch (restoreError) {
        if (!(restoreError instanceof DOMException && restoreError.name === "AbortError")) {
          reportClientWarning("assistant.restoreHistory", restoreError, { sessionKey });
          setHistoryWarning(cachedMessages.length === 0);
        }
      } finally {
        if (!controller.signal.aborted) setHistoryReady(true);
      }
    }
    void restoreHistory();
    return () => controller.abort();
  }, [isOffline, sessionKey, setMessages]);

  useEffect(
    () => () => {
      historyRequestControllerRef.current?.abort();
    },
    [],
  );

  const loadOlderMessages = useCallback(async () => {
    if (!nextHistoryCursor || historyLoadingRef.current || isOffline) return;
    historyLoadingRef.current = true;
    setHistoryLoading(true);
    setHistoryError(false);
    const controller = new AbortController();
    historyRequestControllerRef.current = controller;

    try {
      const response = await client.api.ai.sessions[":sessionKey"].messages.$get(
        { param: { sessionKey }, query: { cursor: nextHistoryCursor } },
        { init: { signal: controller.signal } },
      );
      if (!response.ok) throw new HttpRequestError(response.status);
      const payload = (await (response as Response).json()) as AskZomerHistoryPage;
      await cacheServerMessages(sessionKey, payload.messages);
      setMessages((current) => mergeMessages(payload.messages, current));
      setNextHistoryCursor(payload.nextCursor);
    } catch (loadError) {
      if (!(loadError instanceof DOMException && loadError.name === "AbortError")) {
        reportClientWarning("assistant.loadOlderHistory", loadError, { sessionKey });
        setHistoryError(true);
      }
    } finally {
      if (historyRequestControllerRef.current === controller) {
        historyRequestControllerRef.current = null;
        historyLoadingRef.current = false;
        setHistoryLoading(false);
      }
    }
  }, [isOffline, nextHistoryCursor, sessionKey, setMessages]);

  const syncOutbox = useCallback(async () => {
    if (isOffline || syncRunningRef.current) return;
    syncRunningRef.current = true;
    setSyncStatus("syncing");
    try {
      const result = await synchronizePendingMessages(sessionKey, syncOwnerIdRef.current);
      setSyncStatus(result.synced > 0 ? "synced" : "idle");
    } catch (syncError) {
      reportClientWarning("assistant.syncOfflineMessages", syncError, { sessionKey });
      setSyncStatus("failed");
    } finally {
      syncRunningRef.current = false;
    }
  }, [isOffline, sessionKey]);

  useEffect(() => {
    if (!historyReady || isOffline) return;
    void syncOutbox();
  }, [historyReady, isOffline, syncOutbox]);

  useEffect(() => {
    const handleReconnect = () => void syncOutbox();
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_CHAT_OUTBOX") void syncOutbox();
    };
    window.addEventListener(NETWORK_AVAILABLE_EVENT, handleReconnect);
    navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage);
    return () => {
      window.removeEventListener(NETWORK_AVAILABLE_EVENT, handleReconnect);
      navigator.serviceWorker?.removeEventListener("message", handleServiceWorkerMessage);
    };
  }, [syncOutbox]);

  useEffect(() => {
    if (!("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(`ask-zomer:${sessionKey}`);
    channel.addEventListener("message", () => {
      if (busy) return;
      void getCachedMessages(sessionKey)
        .then((records) => {
          setMessages((current) =>
            mergeMessages(
              current,
              records.map((record) => record.message),
            ),
          );
        })
        .catch((cacheError: unknown) => {
          reportClientWarning("assistant.readBroadcastMessages", cacheError, { sessionKey });
        });
    });
    return () => channel.close();
  }, [busy, sessionKey, setMessages]);

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy || !historyReady) return;
      clearError();
      setLocalError("");

      if (assistantMode === "online") {
        const messageId = crypto.randomUUID();
        const userMessage = createTextMessage({ content: trimmed, id: messageId, role: "user" });
        await putLocalMessage(sessionKey, userMessage);
        setInput("");
        setMessages((current) => mergeMessages(current, [userMessage]));
        onlinePendingIdRef.current = messageId;
        await sendMessage({
          text: trimmed,
          messageId,
          metadata: userMessage.metadata!,
        });
        return;
      }

      if (assistantMode === "unavailable") {
        setLocalError(t("offlineModelRequired"));
        return;
      }
      const knowledge = await getOfflineKnowledge(locale);
      if (!knowledge?.items.length) {
        setLocalError(t("offlineKnowledgeMissing"));
        return;
      }

      const userMessage = createTextMessage({ content: trimmed, role: "user" });
      await putLocalMessage(sessionKey, userMessage);
      setInput("");
      setMessages((current) => mergeMessages(current, [userMessage]));
      setLocalBusy(true);
      localAbortRequestedRef.current = false;
      try {
        const matches = retrieveOfflineKnowledge(trimmed, knowledge.items, window.location.origin);
        const content =
          matches.length === 0
            ? t("offlineKnowledgeUnavailable")
            : await import("@/lib/offline/offline-ai").then((module) =>
                module.generateOfflineAnswer({
                  question: trimmed,
                  matches,
                  history: messages,
                }),
              );
        const assistantMessage = createTextMessage({
          content,
          role: "assistant",
          metadata: {
            model: "offline:SmolLM2-360M-Instruct-q4f16_1-MLC",
            sources: matches.map((match) => match.source),
          },
        });
        await putLocalMessage(sessionKey, assistantMessage);
        setMessages((current) => mergeMessages(current, [assistantMessage]));
        void requestBackgroundSync().catch(() => undefined);
        if ("BroadcastChannel" in window) {
          const channel = new BroadcastChannel(`ask-zomer:${sessionKey}`);
          channel.postMessage({ type: "messages-updated" });
          channel.close();
        }
      } catch (generationError) {
        if (!localAbortRequestedRef.current) {
          reportClientWarning("assistant.generateOffline", generationError, { sessionKey });
          if (
            generationError instanceof Error &&
            /has not been installed/iu.test(generationError.message)
          ) {
            setOfflineModelInstalled(false);
            void setOfflineModelState(undefined).catch((persistenceError: unknown) => {
              reportClientWarning("assistant.clearOfflineModelState", persistenceError);
            });
          }
          setLocalError(t("offlineGenerationFailed"));
        }
      } finally {
        localAbortRequestedRef.current = false;
        setLocalBusy(false);
      }
    },
    [
      busy,
      clearError,
      historyReady,
      assistantMode,
      locale,
      messages,
      sendMessage,
      sessionKey,
      setMessages,
      t,
    ],
  );

  const submitSafely = useCallback(
    (text: string) => {
      if (submissionRunningRef.current) return;
      submissionRunningRef.current = true;
      void submit(text)
        .catch((submitError: unknown) => {
          reportClientWarning("assistant.submit", submitError, { sessionKey });
          setLocalError(tRequest(classifyRequestFailure(submitError)));
        })
        .finally(() => {
          submissionRunningRef.current = false;
        });
    },
    [sessionKey, submit, tRequest],
  );

  useEffect(() => {
    const trimmed = initialQuestion?.trim();
    if (!trimmed || !historyReady || busy || initialQuestionHandled.current) return;
    initialQuestionHandled.current = true;
    const alreadySent = messages.some(
      (message) => message.role === "user" && messageText(message).trim() === trimmed,
    );
    if (alreadySent) return;
    submitSafely(trimmed);
  }, [busy, historyReady, initialQuestion, messages, submitSafely]);
  const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");
  const initialSuggestions = [
    t("initialSuggestions.experience"),
    t("initialSuggestions.projects"),
    t("initialSuggestions.backend"),
    t("initialSuggestions.technologies"),
  ];
  const suggestions =
    locale === "en"
      ? (lastAssistant?.metadata?.suggestions ?? (messages.length === 0 ? initialSuggestions : []))
      : initialSuggestions;

  return (
    <section aria-label={t("conversationLabel")} className="mt-10 border-y border-border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 text-xs text-muted">
        <p className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${isOffline ? "bg-amber-500" : "bg-emerald-500"}`}
          />
          {assistantMode === "online"
            ? t("onlineMode")
            : assistantMode === "offline"
              ? t("offlineMode")
              : t("offlineModeUnavailable")}
        </p>
        {syncStatus !== "idle" ? (
          <p role="status">
            {syncStatus === "syncing"
              ? t("syncing")
              : syncStatus === "synced"
                ? t("syncComplete")
                : t("syncFailed")}
          </p>
        ) : null}
      </div>
      <OfflineAiManager
        installed={offlineModelInstalled}
        onInstalledChange={setOfflineModelInstalled}
      />
      {historyWarning ? (
        <p role="status" className="border-b border-border py-3 text-xs text-muted">
          {t("historyUnavailable")}
        </p>
      ) : null}
      <ChatMessages
        busy={busy}
        hasOlderMessages={nextHistoryCursor !== null}
        historyError={historyError}
        historyLoading={historyLoading}
        loading={!historyReady}
        messages={messages}
        onLoadOlder={loadOlderMessages}
      />

      {historyReady && suggestions.length > 0 ? (
        <div className="py-4">
          <SuggestionList
            disabled={busy || !historyReady}
            onSelect={submitSafely}
            suggestions={suggestions}
          />
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 border-t border-border py-3"
        >
          <p className="text-sm text-red-600 dark:text-red-400">
            {tRequest(classifyRequestFailure(error))}
          </p>
          <button
            type="button"
            disabled={isOffline}
            onClick={() => {
              clearError();
              void regenerate();
            }}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-border px-3 text-xs hover:border-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw aria-hidden="true" size={14} /> {t("retry")}
          </button>
        </div>
      ) : null}

      {localError ? (
        <p
          role="alert"
          className="border-t border-border py-3 text-sm text-red-600 dark:text-red-400"
        >
          {localError}
        </p>
      ) : null}

      <p aria-live="polite" className={busy ? "py-3 text-xs text-muted" : "sr-only"}>
        {busy
          ? localBusy
            ? t("offlineGenerating")
            : status === "submitted"
              ? t("preparingResponse")
              : t("writingResponse")
          : ""}
      </p>

      <form
        className="py-4"
        onSubmit={(event) => {
          event.preventDefault();
          submitSafely(input);
        }}
      >
        <label htmlFor="ask-zomer-input" className="sr-only">
          {t("inputLabel")}
        </label>
        <div className="chat-composer flex items-end gap-2 rounded-xl border border-border bg-background p-2">
          <textarea
            id="ask-zomer-input"
            value={input}
            disabled={!historyReady}
            maxLength={4_000}
            rows={2}
            placeholder={historyReady ? t("inputPlaceholder") : t("restoring")}
            onChange={(event) => setInput(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitSafely(input);
              }
            }}
            className="max-h-40 min-h-12 flex-1 resize-y bg-transparent px-2 py-2 text-base leading-relaxed outline-none placeholder:text-muted focus-visible:bg-border/20 disabled:cursor-wait sm:text-sm"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => {
                if (localBusy) {
                  localAbortRequestedRef.current = true;
                  void import("@/lib/offline/offline-ai")
                    .then((module) => module.interruptOfflineGeneration())
                    .catch((interruptError: unknown) => {
                      localAbortRequestedRef.current = false;
                      reportClientWarning("assistant.interruptOfflineGeneration", interruptError);
                    });
                } else {
                  void stop();
                }
              }}
              aria-label={t("stop")}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-foreground text-background hover:opacity-80"
            >
              <Square aria-hidden="true" size={15} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!historyReady || !input.trim()}
              aria-label={t("send")}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-opacity duration-150 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
            >
              <ArrowUp aria-hidden="true" size={18} />
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted">{t("keyboardHint")}</p>
      </form>
    </section>
  );
}

export function AskZomerChatContent({ initialQuestion }: { initialQuestion: string | undefined }) {
  const t = useTranslations("Assistant");
  const [sessionKey, setSessionKey] = useState<string>();

  useEffect(() => setSessionKey(getOrCreateSessionKey()), []);

  if (!sessionKey) {
    return (
      <div className="mt-10 border-y border-border py-12" aria-busy="true">
        <p className="text-sm text-muted">{t("preparingConversation")}</p>
      </div>
    );
  }

  return <ChatSession initialQuestion={initialQuestion} sessionKey={sessionKey} />;
}
