"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";

import { reportClientError } from "@/lib/client-log";

type ReindexSummary = {
  chunksCreated: number;
  documentsSeen: number;
  documentsUnchanged: number;
};

type ReindexEvent =
  | { message: string; type: "error" }
  | { message: string; type: "progress" }
  | { summary: ReindexSummary; type: "complete" };

type ReindexState = {
  message?: string;
  status: "error" | "idle" | "running" | "success";
};

const initialState: ReindexState = { status: "idle" };

export function KnowledgeIndexForm() {
  const router = useRouter();
  const [force, setForce] = useState(false);
  const [progress, setProgress] = useState<Array<{ id: number; message: string }>>([]);
  const [state, setState] = useState(initialState);
  const nextProgressId = useRef(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProgress([]);
    setState({ status: "running", message: "Starting portfolio indexing…" });

    try {
      // This Next route keeps the HttpOnly admin token server-side before calling Hono.
      const response = await fetch("/admin/api/ai/reindex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(payload?.error?.message ?? "Knowledge indexing could not be started.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completed = false;

      const handleLine = (line: string) => {
        if (!line.trim()) return;
        const update = JSON.parse(line) as ReindexEvent;
        if (update.type === "progress") {
          nextProgressId.current += 1;
          const entry = { id: nextProgressId.current, message: update.message };
          setProgress((current) => [...current, entry].slice(-6));
          setState({ status: "running", message: update.message });
          return;
        }
        if (update.type === "error") throw new Error(update.message);

        completed = true;
        setState({
          status: "success",
          message: `Indexed ${update.summary.documentsSeen} documents and created ${update.summary.chunksCreated} chunks. ${update.summary.documentsUnchanged} documents were unchanged.`,
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) handleLine(line);
        if (done) break;
      }
      handleLine(buffer);
      if (!completed) throw new Error("Knowledge indexing ended without a completion summary.");
      router.refresh();
    } catch (error) {
      reportClientError("admin.reindexKnowledge", error, { force });
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Knowledge indexing could not be completed. Try again or inspect server logs.",
      });
    }
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <div className="flex min-h-16 flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Portfolio knowledge</p>
          <p className="mt-1 max-w-lg text-xs leading-relaxed text-muted">
            Refresh the AI index from published Sanity content. Existing answers remain available
            until each updated document is ready.
          </p>
          <label className="mt-2 flex min-h-10 w-fit cursor-pointer items-center gap-2 text-xs text-muted">
            <input
              checked={force}
              disabled={state.status === "running"}
              onChange={(event) => setForce(event.currentTarget.checked)}
              type="checkbox"
              className="size-4 accent-foreground"
            />
            Re-embed unchanged documents
          </label>
        </div>
        <button
          type="submit"
          disabled={state.status === "running"}
          aria-busy={state.status === "running"}
          className="min-h-11 shrink-0 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity duration-150 hover:opacity-80 disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none"
        >
          {state.status === "running" ? "Reindexing AI data…" : "Reindex AI data"}
        </button>
      </div>

      <div role={state.status === "error" ? "alert" : "status"} aria-atomic="true">
        {state.status === "running" ? (
          <div className="mb-4 rounded-md border border-border p-3">
            <div className="flex items-center gap-2 text-xs font-medium">
              <LoaderCircle
                aria-hidden="true"
                className="size-3.5 animate-spin motion-reduce:animate-none"
              />
              Indexing portfolio
            </div>
            <ol className="mt-2 space-y-1 font-mono text-xs leading-relaxed text-muted">
              {progress.map((entry, index) => (
                <li key={entry.id} className="flex gap-2">
                  <span aria-hidden="true" className="text-border">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{entry.message}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        {state.message && state.status !== "running" ? (
          <p
            className={
              state.status === "error"
                ? "pb-4 text-sm text-red-600 dark:text-red-400"
                : "pb-4 text-sm text-muted"
            }
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
