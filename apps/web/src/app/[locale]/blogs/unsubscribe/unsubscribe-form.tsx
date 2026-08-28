"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/navigation";
import { client } from "@/lib/api";
import { reportClientError } from "@/lib/client-log";
import { classifyRequestFailure, HttpRequestError } from "@/lib/request-failure";

export function UnsubscribeForm({ token }: { token?: string }) {
  const t = useTranslations("Blogs.unsubscribe");
  const tRequest = useTranslations("Errors.request");
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">(
    token ? "idle" : "error",
  );
  const [message, setMessage] = useState(token ? t("ready") : t("invalid"));

  async function unsubscribe() {
    if (!token) return;
    setState("submitting");
    setMessage(t("working"));
    try {
      const response = await client.api.notifications.email.unsubscribe.$post({
        query: { token },
      });
      if (!response.ok) throw new HttpRequestError(response.status);
      setState("success");
      setMessage(t("success"));
    } catch (error) {
      reportClientError("notifications.unsubscribeEmail", error);
      setState("error");
      const kind = classifyRequestFailure(error);
      setMessage(kind === "validation" || kind === "notFound" ? t("invalid") : tRequest(kind));
    }
  }

  return (
    <div className="mt-8 border-y border-border py-5">
      <p role={state === "error" ? "alert" : "status"} className="text-sm text-muted">
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
            {state === "submitting" ? t("working") : t("button")}
          </button>
        ) : null}
        <Link
          href="/blogs"
          className="inline-flex min-h-10 items-center px-2 text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("return")}
        </Link>
      </div>
    </div>
  );
}
