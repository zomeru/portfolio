"use client";

import { useActionState } from "react";
import { initialReindexState } from "./action-state";
import { triggerKnowledgeReindex } from "./actions";

export function KnowledgeIndexForm() {
  const [state, formAction, isPending] = useActionState(
    triggerKnowledgeReindex,
    initialReindexState,
  );

  return (
    <form action={formAction}>
      <div className="flex min-h-16 flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Portfolio knowledge</p>
          <p className="mt-1 max-w-lg text-xs leading-relaxed text-muted">
            Fetch published Sanity content and refresh changed search chunks. Existing answers
            remain available while indexing runs.
          </p>
          <label className="mt-3 flex min-h-11 w-fit cursor-pointer items-center gap-2 text-xs text-muted">
            <input name="force" type="checkbox" className="size-4 accent-foreground" />
            Re-embed unchanged documents
          </label>
        </div>
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="min-h-11 shrink-0 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity duration-150 hover:opacity-80 disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none"
        >
          {isPending ? "Indexing portfolio…" : "Reindex knowledge"}
        </button>
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={state.message ? "pb-4 text-sm" : "sr-only"}
      >
        {state.message ? (
          <p className={state.status === "error" ? "text-red-600 dark:text-red-400" : "text-muted"}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
