"use client";

import type { AdminCapability } from "@portfolio/api";
import { useActionState } from "react";
import { initialLoginState } from "./action-state";
import { authenticateAdmin } from "./actions";

export function LoginForm({ capability }: { capability: AdminCapability }) {
  const [state, formAction, isPending] = useActionState(authenticateAdmin, initialLoginState);
  const isPublishing = capability === "blog-generation";
  const inputId = `admin-secret-${capability}`;
  const helpId = `admin-login-help-${capability}`;
  const errorId = `admin-login-error-${capability}`;

  return (
    <form action={formAction} className="mt-4 border-t border-border/70 pt-4">
      <input type="hidden" name="capability" value={capability} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="block text-sm font-medium">
            {isPublishing ? "Publishing access" : "AI indexing access"}
          </label>
          <p id={helpId} className="mt-1 text-xs leading-relaxed text-muted">
            {isPublishing
              ? "Enter the publishing secret to unlock manual article generation."
              : "Enter the AI reindexing secret to unlock knowledge reindexing."}
          </p>
          <input
            id={inputId}
            name="secret"
            type="password"
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            disabled={isPending}
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? errorId : helpId}
            className="mt-3 min-h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm placeholder:text-muted/70 sm:max-w-sm"
            placeholder={isPublishing ? "Publishing secret…" : "AI reindexing secret…"}
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="min-h-10 shrink-0 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity duration-150 hover:opacity-80 disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none"
        >
          {isPending ? "Unlocking…" : "Unlock"}
        </button>
      </div>
      {state.error ? (
        <p id={errorId} role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
