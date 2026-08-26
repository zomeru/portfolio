"use client";

import Link from "next/link";
import { useState } from "react";

import { client } from "@/lib/api";
import { reportClientError } from "@/lib/client-log";

export function UnsubscribeForm({ token }: { token?: string }) {
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">(
    token ? "idle" : "error",
  );
  const [message, setMessage] = useState(
    token ? "You will stop receiving new-post emails." : "This unsubscribe link is invalid.",
  );

  async function unsubscribe() {
    if (!token) return;
    setState("submitting");
    setMessage("Unsubscribing…");
    try {
      const response = await client.api.notifications.email.unsubscribe.$post({
        query: { token },
      });
      if (!response.ok) throw new Error("Unable to unsubscribe.");
      setState("success");
      setMessage("You are unsubscribed from blog emails.");
    } catch (error) {
      reportClientError("notifications.unsubscribeEmail", error);
      setState("error");
      setMessage("Unable to unsubscribe. Check the link or try again.");
    }
  }

  return (
    <div className="mt-8 border-y border-border py-5">
      <p role="status" aria-live="polite" className="text-sm text-muted">
        {message}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {state !== "success" ? (
          <button
            type="button"
            onClick={() => {
              void unsubscribe();
            }}
            disabled={!token || state === "submitting"}
            className="min-h-10 rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
          >
            {state === "submitting" ? "Unsubscribing…" : "Unsubscribe"}
          </button>
        ) : null}
        <Link
          href="/blogs"
          className="inline-flex min-h-10 items-center px-2 text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
        >
          Return to the blog
        </Link>
      </div>
    </div>
  );
}
