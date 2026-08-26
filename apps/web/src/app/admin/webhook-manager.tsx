"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";

import { reportClientError } from "@/lib/client-log";

import { initialWebhookMutationState, initialWebhookRegistrationState } from "./action-state";
import { disableWebhook, registerWebhook, testWebhook } from "./actions";

export type WebhookSummary = {
  id: string;
  name: string;
  destinationType: "discord" | "generic" | "slack";
  status: "active" | "disabled";
  createdAt: string;
  disabledAt: string | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function WebhookRow({ webhook }: { webhook: WebhookSummary }) {
  const [testState, testAction, testPending] = useActionState(
    testWebhook,
    initialWebhookMutationState,
  );
  const [disableState, disableAction, disablePending] = useActionState(
    disableWebhook,
    initialWebhookMutationState,
  );
  const active = webhook.status === "active";
  const visibleState = disableState.message ? disableState : testState;
  const message = visibleState.message;
  const error = visibleState.status === "error";

  return (
    <li className="py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="wrap-break-word text-sm font-medium">{webhook.name}</p>
            <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[0.6875rem] uppercase text-muted">
              {webhook.destinationType}
            </span>
            <span className="text-xs text-muted">{active ? "Active" : "Disabled"}</span>
          </div>
          <p className="mt-1 text-xs text-muted">Connected {formatDate(webhook.createdAt)} UTC</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={testAction}>
            <input type="hidden" name="id" value={webhook.id} />
            <button
              type="submit"
              disabled={!active || testPending || disablePending}
              aria-busy={testPending}
              className="min-h-10 rounded-md border border-border px-3 text-xs transition-colors duration-150 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
            >
              {testPending ? "Sending test…" : "Send test"}
            </button>
          </form>
          <form action={disableAction}>
            <input type="hidden" name="id" value={webhook.id} />
            <button
              type="submit"
              disabled={!active || testPending || disablePending}
              aria-busy={disablePending}
              className="min-h-10 rounded-md border border-border px-3 text-xs text-muted transition-colors duration-150 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none dark:hover:text-red-400"
            >
              {disablePending ? "Disabling…" : "Disable"}
            </button>
          </form>
        </div>
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={message ? "mt-2 text-xs" : "sr-only"}
      >
        {message ? (
          <p className={error ? "text-red-600 dark:text-red-400" : "text-muted"}>{message}</p>
        ) : null}
      </div>
    </li>
  );
}

export function WebhookManager({
  webhooks,
  loadFailed,
}: {
  webhooks: WebhookSummary[];
  loadFailed: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    registerWebhook,
    initialWebhookRegistrationState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const [destinationType, setDestinationType] =
    useState<WebhookSummary["destinationType"]>("discord");
  const [revealSecret, setRevealSecret] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const prefix = useId();
  const nameId = `${prefix}-name`;
  const typeId = `${prefix}-type`;
  const urlId = `${prefix}-url`;

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setDestinationType("discord");
      setRevealSecret(false);
      setCopyMessage("");
      return;
    }
    if (state.fieldErrors?.name) nameRef.current?.focus();
    else if (state.fieldErrors?.destinationType) typeRef.current?.focus();
    else if (state.fieldErrors?.url) urlRef.current?.focus();
  }, [state]);

  async function copySecret() {
    if (!state.secret) return;
    try {
      await navigator.clipboard.writeText(state.secret);
      setCopyMessage("Signing secret copied.");
    } catch (error) {
      reportClientError("admin.copyWebhookSecret", error);
      setCopyMessage("Unable to copy. Select and copy the secret manually.");
    }
  }

  return (
    <div className="mt-6 border-t border-border/70 pt-5">
      <div>
        <h3 className="text-sm font-medium">Webhook destinations</h3>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
          Connect Discord, Slack, or a generic HTTPS endpoint. Webhook URLs are encrypted and are
          never shown again after registration.
        </p>
      </div>

      <form ref={formRef} action={formAction} className="mt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor={nameId} className="block text-xs font-medium">
              Name
            </label>
            <input
              ref={nameRef}
              id={nameId}
              name="name"
              required
              maxLength={100}
              disabled={isPending}
              aria-invalid={state.fieldErrors?.name ? true : undefined}
              aria-describedby={state.fieldErrors?.name ? `${nameId}-error` : `${nameId}-help`}
              placeholder="Engineering Discord"
              className="mt-2 min-h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm placeholder:text-muted/70"
            />
            <p id={`${nameId}-help`} className="mt-1 text-xs text-muted">
              Use a name that identifies the channel or receiving system.
            </p>
            {state.fieldErrors?.name ? (
              <p id={`${nameId}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400">
                {state.fieldErrors.name}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={typeId} className="block text-xs font-medium">
              Destination type
            </label>
            <select
              ref={typeRef}
              id={typeId}
              name="destinationType"
              defaultValue="discord"
              disabled={isPending}
              aria-invalid={state.fieldErrors?.destinationType ? true : undefined}
              aria-describedby={
                state.fieldErrors?.destinationType ? `${typeId}-error` : `${typeId}-help`
              }
              onChange={(event) =>
                setDestinationType(event.currentTarget.value as WebhookSummary["destinationType"])
              }
              className="mt-2 min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="discord">Discord</option>
              <option value="slack">Slack</option>
              <option value="generic">Generic HTTPS</option>
            </select>
            <p id={`${typeId}-help`} className="mt-1 text-xs text-muted">
              {destinationType === "generic"
                ? "Generic endpoints receive signed JSON."
                : `${destinationType === "discord" ? "Discord" : "Slack"} receives a formatted channel message.`}
            </p>
            {state.fieldErrors?.destinationType ? (
              <p id={`${typeId}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400">
                {state.fieldErrors.destinationType}
              </p>
            ) : null}
          </div>

          <div className="md:col-span-2">
            <label htmlFor={urlId} className="block text-xs font-medium">
              Webhook URL
            </label>
            <input
              ref={urlRef}
              id={urlId}
              name="url"
              type="url"
              inputMode="url"
              required
              maxLength={2_048}
              disabled={isPending}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={state.fieldErrors?.url ? true : undefined}
              aria-describedby={state.fieldErrors?.url ? `${urlId}-error` : `${urlId}-help`}
              placeholder={
                destinationType === "discord"
                  ? "https://discord.com/api/webhooks/…"
                  : destinationType === "slack"
                    ? "https://hooks.slack.com/services/…"
                    : "https://example.com/webhooks/blogs"
              }
              className="mt-2 min-h-10 w-full rounded-md border border-border bg-transparent px-3 font-mono text-xs placeholder:text-muted/70"
            />
            <p id={`${urlId}-help`} className="mt-1 text-xs leading-relaxed text-muted">
              Treat this URL as a credential. Only public HTTPS destinations on port 443 are
              accepted.
            </p>
            {state.fieldErrors?.url ? (
              <p id={`${urlId}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400">
                {state.fieldErrors.url}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={state.message ? "text-sm" : "sr-only"}
          >
            {state.message ? (
              <p
                className={
                  state.status === "error" ? "text-red-600 dark:text-red-400" : "text-muted"
                }
              >
                {state.message}
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            className="min-h-10 shrink-0 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity duration-150 hover:opacity-80 disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none"
          >
            {isPending ? "Connecting…" : "Connect webhook"}
          </button>
        </div>
      </form>

      {state.secret ? (
        <div className="mt-4 rounded-md border border-border p-4">
          <p className="text-sm font-medium">Save the signing secret now</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            This secret verifies generic webhook requests and will not be shown again.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              aria-label="Generic webhook signing secret"
              type={revealSecret ? "text" : "password"}
              readOnly
              value={state.secret}
              autoComplete="off"
              className="min-h-10 min-w-0 flex-1 rounded-md border border-border bg-transparent px-3 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => setRevealSecret((current) => !current)}
              className="min-h-10 rounded-md border border-border px-3 text-xs"
            >
              {revealSecret ? "Hide secret" : "Show secret"}
            </button>
            <button
              type="button"
              onClick={() => {
                void copySecret();
              }}
              className="min-h-10 rounded-md border border-border px-3 text-xs"
            >
              Copy secret
            </button>
          </div>
          <p
            role="status"
            aria-live="polite"
            className={copyMessage ? "mt-2 text-xs text-muted" : "sr-only"}
          >
            {copyMessage}
          </p>
        </div>
      ) : null}

      <div className="mt-6">
        <h4 className="font-mono text-xs uppercase tracking-widest text-muted">
          Connected destinations
        </h4>
        {loadFailed ? (
          <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            Webhook destinations could not be loaded. Check server logs and refresh the page.
          </p>
        ) : webhooks.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No webhook destinations yet. Connect one above to receive publication notifications.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {webhooks.map((webhook) => (
              <WebhookRow key={webhook.id} webhook={webhook} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
