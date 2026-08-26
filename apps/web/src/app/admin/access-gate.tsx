"use client";

import { useActionState, useEffect, useRef } from "react";

import { initialLoginState } from "./action-state";
import { authenticateAdminAccess } from "./actions";

export function AdminAccessGate() {
  const [state, formAction, isPending] = useActionState(authenticateAdminAccess, initialLoginState);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const helpId = "admin-access-help";
  const errorId = "admin-access-error";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) dialog.showModal();
    inputRef.current?.focus();

    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="admin-access-title"
      aria-describedby={state.error ? `${helpId} ${errorId}` : helpId}
      onCancel={(event) => event.preventDefault()}
      className="m-auto w-[calc(100%-2rem)] max-w-md overscroll-contain rounded-lg border border-border/80 bg-background/95 p-5 text-foreground shadow-2xl backdrop:bg-background/85 backdrop:backdrop-blur-xl sm:p-6"
    >
      <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-muted">
        Restricted area
      </p>
      <h1 id="admin-access-title" className="mt-3 text-xl font-medium">
        Unlock admin access
      </h1>
      <p id={helpId} className="mt-2 text-sm leading-relaxed text-muted">
        Enter the page access key to continue to the portfolio administration controls.
      </p>

      <form action={formAction} className="mt-6">
        <label htmlFor="admin-access-key" className="block text-sm font-medium">
          Admin access key
        </label>
        <input
          ref={inputRef}
          id="admin-access-key"
          name="accessKey"
          type="password"
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          disabled={isPending}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? errorId : helpId}
          className="mt-2 min-h-11 w-full rounded-md border border-border bg-transparent px-3 text-sm placeholder:text-muted/70"
          placeholder="Admin access key…"
        />
        {state.error ? (
          <p id={errorId} role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="mt-5 min-h-11 w-full rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity duration-150 hover:opacity-80 disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none"
        >
          {isPending ? "Unlocking…" : "Unlock admin page"}
        </button>
      </form>
    </dialog>
  );
}
