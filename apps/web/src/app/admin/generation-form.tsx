"use client";

import Link from "next/link";
import { useActionState } from "react";
import { initialGenerationState } from "./action-state";
import { triggerBlogGeneration } from "./actions";

export function GenerationForm() {
  const [state, formAction, isPending] = useActionState(
    triggerBlogGeneration,
    initialGenerationState,
  );

  return (
    <form action={formAction}>
      <div className="flex min-h-16 flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">New article</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Generate one article and publish it to Sanity.
          </p>
        </div>
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="min-h-10 shrink-0 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity duration-150 hover:opacity-80 disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none"
        >
          {isPending ? "Generating article…" : "Generate article"}
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
            {state.message}{" "}
            {state.post ? (
              <Link
                href={`/blogs/${state.post.slug}`}
                className="text-foreground underline underline-offset-4"
              >
                View “{state.post.title}”
              </Link>
            ) : null}
          </p>
        ) : null}
      </div>
    </form>
  );
}
