"use client";

import { useChat } from "@ai-sdk/react";
import type { AskZomerMessage, AskZomerSource } from "@portfolio/api/types";
import { DefaultChatTransport } from "ai";
import { ArrowUp, RefreshCw, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SESSION_STORAGE_KEY = "ask-zomer-session";
const INITIAL_SUGGESTIONS = [
  "What's Zomer's experience?",
  "What projects has he built?",
  "What's his backend experience?",
  "What technologies does he use?",
  "What has he written about?",
] as const;

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

function SourceList({ sources }: { sources: AskZomerSource[] }) {
  if (sources.length === 0) return null;

  return (
    <details className="mt-3 border-t border-border pt-3 text-xs text-muted">
      <summary className="w-fit cursor-pointer rounded-sm py-1 font-mono uppercase tracking-widest hover:text-foreground">
        {sources.length} {sources.length === 1 ? "source" : "sources"}
      </summary>
      <ol className="mt-2 space-y-2">
        {sources.map((source, index) => (
          <li key={source.id} className="flex gap-2">
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
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">Suggested questions</legend>
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

function ChatMessages({ messages }: { messages: AskZomerMessage[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  });

  return (
    <div
      aria-live="polite"
      aria-relevant="additions text"
      className="max-h-[34rem] min-h-72 space-y-6 overflow-y-auto overscroll-contain px-1 py-5 sm:min-h-96"
    >
      {messages.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center text-center sm:min-h-80">
          <div className="max-w-md">
            <p className="text-sm font-medium">What would you like to know?</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Try a question about work history, technical strengths, selected projects, or recent
              articles.
            </p>
          </div>
        </div>
      ) : (
        messages.map((message) => {
          const text = messageText(message);
          const sources = message.metadata?.sources ?? [];
          return (
            <article
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-foreground px-4 py-3 text-sm leading-relaxed text-background sm:max-w-[75%]"
                  : "max-w-2xl"
              }
            >
              <p className="sr-only">{message.role === "user" ? "You" : "Ask Zomer AI"}</p>
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
      <div ref={endRef} />
    </div>
  );
}

function ChatSession({ sessionKey }: { sessionKey: string }) {
  const [input, setInput] = useState("");
  const [historyReady, setHistoryReady] = useState(false);
  const [historyWarning, setHistoryWarning] = useState<string>();
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
        const response = await fetch(`/api/ai/sessions/${sessionKey}/messages`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Conversation history is unavailable.");
        const payload = (await response.json()) as { messages?: AskZomerMessage[] };
        setMessages(payload.messages ?? []);
      } catch (restoreError) {
        if (!(restoreError instanceof DOMException && restoreError.name === "AbortError")) {
          setHistoryWarning("Saved conversation history is unavailable right now.");
        }
      } finally {
        if (!controller.signal.aborted) setHistoryReady(true);
      }
    }
    void restoreHistory();
    return () => controller.abort();
  }, [sessionKey, setMessages]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy || !historyReady) return;
    clearError();
    setInput("");
    void sendMessage({ text: trimmed, metadata: { createdAt: new Date().toISOString() } });
  };
  const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");
  const suggestions =
    lastAssistant?.metadata?.suggestions ?? (messages.length === 0 ? INITIAL_SUGGESTIONS : []);

  return (
    <section aria-label="Ask Zomer AI conversation" className="mt-8 border-y border-border">
      {historyWarning ? (
        <p role="status" className="border-b border-border py-3 text-xs text-muted">
          {historyWarning} You can still start a new conversation.
        </p>
      ) : null}
      <ChatMessages messages={messages} />

      {suggestions.length > 0 ? (
        <div className="border-t border-border py-4">
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
            {error.message || "The response could not be completed."}
          </p>
          <button
            type="button"
            onClick={() => {
              clearError();
              void regenerate();
            }}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-border px-3 text-xs hover:border-foreground"
          >
            <RefreshCw aria-hidden="true" size={14} /> Retry
          </button>
        </div>
      ) : null}

      <p
        aria-live="polite"
        className={busy ? "border-t border-border py-3 text-xs text-muted" : "sr-only"}
      >
        {busy ? (status === "submitted" ? "Searching the portfolio…" : "Writing a response…") : ""}
      </p>

      <form
        className="border-t border-border py-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit(input);
        }}
      >
        <label htmlFor="ask-zomer-input" className="sr-only">
          Ask Zomer AI a question
        </label>
        <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-foreground">
          <textarea
            id="ask-zomer-input"
            value={input}
            disabled={!historyReady}
            maxLength={4_000}
            rows={2}
            placeholder={historyReady ? "Ask about Zomer's work…" : "Restoring conversation…"}
            onChange={(event) => setInput(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit(input);
              }
            }}
            className="max-h-40 min-h-12 flex-1 resize-y bg-transparent px-2 py-2 text-base leading-relaxed outline-none placeholder:text-muted disabled:cursor-wait sm:text-sm"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => void stop()}
              aria-label="Stop generating"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-foreground text-background hover:opacity-80"
            >
              <Square aria-hidden="true" size={15} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!historyReady || !input.trim()}
              aria-label="Send message"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-opacity duration-150 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
            >
              <ArrowUp aria-hidden="true" size={18} />
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted">Enter to send · Shift+Enter for a new line</p>
      </form>
    </section>
  );
}

export function AskZomerChat() {
  const [sessionKey, setSessionKey] = useState<string>();

  useEffect(() => setSessionKey(getOrCreateSessionKey()), []);

  if (!sessionKey) {
    return (
      <div className="mt-8 min-h-96 border-y border-border py-8" aria-busy="true">
        <p className="text-sm text-muted">Preparing your conversation…</p>
      </div>
    );
  }

  return <ChatSession sessionKey={sessionKey} />;
}
