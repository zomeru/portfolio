"use client";

import { useActionState } from "react";

import { initialNotificationRetryState } from "./action-state";
import { retryNotifications } from "./actions";

export function NotificationRetryForm() {
  const [state, action, pending] = useActionState(
    retryNotifications,
    initialNotificationRetryState,
  );

  return (
    <form action={action} className="py-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium">Queued deliveries</p>
          <p className="mt-1 text-xs text-muted">
            Retry ready email, browser, and webhook notifications.
          </p>
        </div>
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="min-h-10 rounded-md border border-border px-3 text-xs transition-colors duration-150 hover:border-foreground disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
        >
          {pending ? "Retrying…" : "Retry notifications"}
        </button>
      </div>
      <p
        role={state.status === "error" ? "alert" : "status"}
        className={`min-h-5 pt-2 text-xs ${state.status === "error" ? "text-error" : "text-muted"}`}
      >
        {state.message}
      </p>
    </form>
  );
}
