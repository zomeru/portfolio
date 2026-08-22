"use client";

import { useActionState } from "react";
import { initialLoginState } from "./action-state";
import { authenticateAdmin } from "./actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(authenticateAdmin, initialLoginState);

  return (
    <form action={formAction} className="mt-3 border-y border-border py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <label htmlFor="admin-secret" className="block text-sm font-medium">
            Admin access
          </label>
          <p id="admin-login-help" className="mt-1 text-xs leading-relaxed text-muted">
            Enter the private publishing secret to continue.
          </p>
          <input
            id="admin-secret"
            name="secret"
            type="password"
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            disabled={isPending}
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "admin-login-error" : "admin-login-help"}
            className="mt-3 min-h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm placeholder:text-muted/70 sm:max-w-sm"
            placeholder="Publishing secret…"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="min-h-10 shrink-0 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity duration-150 hover:opacity-80 disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none"
        >
          Sign in
        </button>
      </div>
      {state.error ? (
        <p
          id="admin-login-error"
          role="alert"
          className="mt-3 text-sm text-red-600 dark:text-red-400"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
