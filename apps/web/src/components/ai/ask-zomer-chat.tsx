"use client";

import { useChat } from "@ai-sdk/react";
import type { AskZomerMessage, AskZomerSource } from "@portfolio/api/types";
import { DefaultChatTransport, getToolName, isToolUIPart } from "ai";
import { ArrowUp, Globe2, LoaderCircle, RefreshCw, Square } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { client } from "@/lib/api";
import { reportClientWarning } from "@/lib/client-log";
import { classifyRequestFailure, HttpRequestError } from "@/lib/request-failure";

const SESSION_STORAGE_KEY = "ask-zomer-session";
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
  const sources = [...(message.metadata?.sources ?? [])];
  const seenUrls = new Set(sources.map((source) => source.url));

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
  loading,
  messages,
}: {
  busy: boolean;
  loading: boolean;
  messages: AskZomerMessage[];
}) {
  const t = useTranslations("Assistant");
  return (
    <div aria-live="polite" aria-relevant="additions text" className="space-y-5 py-6">
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
        messages.map((message, index) => {
          const text = messageText(message);
          const sources = messageSources(message);
          const isLatestAssistant = message.role === "assistant" && index === messages.length - 1;
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
        })
      )}
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
  const [input, setInput] = useState("");
  const [historyReady, setHistoryReady] = useState(false);
  const [historyWarning, setHistoryWarning] = useState(false);
  const initialQuestionHandled = useRef(false);
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
    useChat<AskZomerMessage>({ id: sessionKey, transport, throttle: 50 });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    const controller = new AbortController();
    async function restoreHistory() {
      try {
        const response = await client.api.ai.sessions[":sessionKey"].messages.$get(
          { param: { sessionKey } },
          { init: { signal: controller.signal } },
        );
        if (!response.ok) throw new HttpRequestError(response.status);
        const payload = (await (response as Response).json()) as {
          messages?: AskZomerMessage[];
        };
        setMessages(payload.messages ?? []);
      } catch (restoreError) {
        if (!(restoreError instanceof DOMException && restoreError.name === "AbortError")) {
          reportClientWarning("assistant.restoreHistory", restoreError, { sessionKey });
          setHistoryWarning(true);
        }
      } finally {
        if (!controller.signal.aborted) setHistoryReady(true);
      }
    }
    void restoreHistory();
    return () => controller.abort();
  }, [sessionKey, setMessages]);

  useEffect(() => {
    const trimmed = initialQuestion?.trim();
    if (!trimmed || !historyReady || busy || initialQuestionHandled.current) return;
    initialQuestionHandled.current = true;
    const alreadySent = messages.some(
      (message) => message.role === "user" && messageText(message).trim() === trimmed,
    );
    if (alreadySent) return;
    clearError();
    void sendMessage({ text: trimmed, metadata: { createdAt: new Date().toISOString() } });
  }, [busy, clearError, historyReady, initialQuestion, messages, sendMessage]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy || !historyReady) return;
    clearError();
    setInput("");
    void sendMessage({ text: trimmed, metadata: { createdAt: new Date().toISOString() } });
  };
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
      {historyWarning ? (
        <p role="status" className="border-b border-border py-3 text-xs text-muted">
          {t("historyUnavailable")}
        </p>
      ) : null}
      <ChatMessages busy={busy} loading={!historyReady} messages={messages} />

      {historyReady && suggestions.length > 0 ? (
        <div className="py-4">
          <SuggestionList
            disabled={busy || !historyReady}
            onSelect={submit}
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
            onClick={() => {
              clearError();
              void regenerate();
            }}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-border px-3 text-xs hover:border-foreground"
          >
            <RefreshCw aria-hidden="true" size={14} /> {t("retry")}
          </button>
        </div>
      ) : null}

      <p aria-live="polite" className={busy ? "py-3 text-xs text-muted" : "sr-only"}>
        {busy ? (status === "submitted" ? t("preparingResponse") : t("writingResponse")) : ""}
      </p>

      <form
        className="py-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit(input);
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
                submit(input);
              }
            }}
            className="max-h-40 min-h-12 flex-1 resize-y bg-transparent px-2 py-2 text-base leading-relaxed outline-none placeholder:text-muted focus-visible:bg-border/20 disabled:cursor-wait sm:text-sm"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => void stop()}
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
