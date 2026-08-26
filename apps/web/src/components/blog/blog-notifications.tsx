"use client";

import { useEffect, useId, useRef, useState } from "react";

import { client } from "@/lib/api";
import { reportClientError } from "@/lib/client-log";

const PUSH_DISMISSAL_KEY = "blog-push-prompt:v1";
const PUSH_DISMISSAL_TTL_MS = 30 * 24 * 60 * 60 * 1_000;
const PUSH_SYNC_KEY = "blog-push-server-sync:v1";
const PUSH_SYNC_TTL_MS = 24 * 60 * 60 * 1_000;
const SHOW_PUSH_TEST = process.env.NODE_ENV === "development";

type EmailState = {
  kind: "idle" | "submitting" | "success" | "error";
  message: string;
  invalid?: boolean;
};

type PushState =
  | { kind: "checking" | "hidden" | "unsupported" }
  | {
      kind: "prompt" | "blocked" | "ios-install" | "working" | "error" | "unavailable";
      message?: string;
    }
  | { kind: "subscribed"; subscription: PushSubscription; message?: string };

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replaceAll("-", "+").replaceAll("_", "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

function savePushDismissal() {
  try {
    localStorage.setItem(PUSH_DISMISSAL_KEY, Date.now().toString());
  } catch {
    // Presentation preferences are best-effort in restricted browser storage.
  }
}

function hasRecentPushDismissal() {
  try {
    const timestamp = Number(localStorage.getItem(PUSH_DISMISSAL_KEY));
    return Number.isFinite(timestamp) && Date.now() - timestamp < PUSH_DISMISSAL_TTL_MS;
  } catch {
    return false;
  }
}

function clearPushDismissal() {
  try {
    localStorage.removeItem(PUSH_DISMISSAL_KEY);
  } catch {
    // Presentation preferences are best-effort in restricted browser storage.
  }
}

function getLastPushSync() {
  try {
    return Number(localStorage.getItem(PUSH_SYNC_KEY));
  } catch {
    return 0;
  }
}

function savePushSync() {
  try {
    localStorage.setItem(PUSH_SYNC_KEY, Date.now().toString());
  } catch {
    // Server persistence remains authoritative when browser storage is restricted.
  }
}

function clearPushSync() {
  try {
    localStorage.removeItem(PUSH_SYNC_KEY);
  } catch {
    // Server persistence remains authoritative when browser storage is restricted.
  }
}

function serializePushSubscription(subscription: PushSubscription) {
  const serialized = subscription.toJSON();
  if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys.auth) return null;
  return {
    endpoint: serialized.endpoint,
    keys: { p256dh: serialized.keys.p256dh, auth: serialized.keys.auth },
  };
}

async function persistPushSubscription(subscription: PushSubscription) {
  const serialized = serializePushSubscription(subscription);
  if (!serialized) return false;
  const response = await client.api.notifications.push.subscribe.$post({ json: serialized });
  if (response.ok) savePushSync();
  return response.ok;
}

function subscriptionUsesKey(subscription: PushSubscription, publicKey: string) {
  const currentKey = subscription.options.applicationServerKey;
  if (!currentKey) return false;
  const expected = urlBase64ToUint8Array(publicKey);
  const current = new Uint8Array(currentKey);
  return (
    current.length === expected.length && current.every((byte, index) => byte === expected[index])
  );
}

async function getPushConfig() {
  const response = await client.api.notifications.push.config.$get();
  const config = await response.json();
  return response.ok && config.enabled && config.publicKey
    ? { enabled: true as const, publicKey: config.publicKey }
    : null;
}

function getIosInstallState() {
  return {
    ios: /iPad|iPhone|iPod/.test(navigator.userAgent),
    standalone: window.matchMedia("(display-mode: standalone)").matches,
  };
}

export function BlogNotifications({ initialNotice }: { initialNotice?: "confirmed" | "invalid" }) {
  const emailId = useId();
  const emailHelpId = useId();
  const emailStatusId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const [emailState, setEmailState] = useState<EmailState>(() => {
    if (initialNotice === "confirmed") {
      return { kind: "success", message: "Your email subscription is confirmed." };
    }
    if (initialNotice === "invalid") {
      return { kind: "error", message: "This confirmation link is invalid or expired." };
    }
    return { kind: "idle", message: "" };
  });
  const [pushState, setPushState] = useState<PushState>({ kind: "checking" });
  const [pushTesting, setPushTesting] = useState(false);

  useEffect(() => {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setPushState({ kind: "unsupported" });
      return;
    }
    let active = true;
    async function initializePush() {
      try {
        const config = await getPushConfig();
        if (!active) return;
        if (!config) {
          setPushState({
            kind: "unavailable",
            message: "Browser notifications are not configured on the server yet.",
          });
          return;
        }
        await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!active) return;
        if (subscription && !subscriptionUsesKey(subscription, config.publicKey)) {
          await subscription.unsubscribe();
          clearPushSync();
          setPushState({
            kind: "prompt",
            message: "Notification security keys changed. Enable notifications again.",
          });
          return;
        }
        if (subscription) {
          const recentlySynced = Date.now() - getLastPushSync() < PUSH_SYNC_TTL_MS;
          if (!recentlySynced && !(await persistPushSubscription(subscription))) {
            setPushState({
              kind: "error",
              message: "This browser is subscribed, but it could not sync with the server.",
            });
            return;
          }
          setPushState({ kind: "subscribed", subscription });
          return;
        }
        if (Notification.permission === "denied") {
          setPushState({
            kind: "blocked",
            message: "Notifications are blocked in this browser's site settings.",
          });
          return;
        }
        const { ios, standalone } = getIosInstallState();
        if (ios && !standalone) {
          setPushState({
            kind: "ios-install",
            message:
              "On iPhone or iPad, add this site to your Home Screen before enabling notifications.",
          });
          return;
        }
        setPushState(hasRecentPushDismissal() ? { kind: "hidden" } : { kind: "prompt" });
      } catch (error) {
        reportClientError("notifications.initializePush", error);
        if (active) {
          setPushState({
            kind: "unavailable",
            message: "Browser notification status could not be checked. Try again shortly.",
          });
        }
      }
    }
    void initializePush();
    return () => {
      active = false;
    };
  }, []);

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = emailRef.current;
    if (!input?.validity.valid) {
      setEmailState({ kind: "error", message: "Enter a valid email address.", invalid: true });
      input?.focus();
      return;
    }
    setEmailState({ kind: "submitting", message: "Subscribing…" });
    try {
      const response = await client.api.notifications.email.subscribe.$post({
        json: { email: input.value },
      });
      const payload = await response.json();
      if (!response.ok || !("success" in payload)) {
        const code = "error" in payload ? payload.error.code : "SERVER_ERROR";
        setEmailState({
          kind: "error",
          message:
            code === "RATE_LIMITED"
              ? "Too many attempts. Try again in an hour."
              : code === "INVALID_EMAIL"
                ? "Enter a valid email address."
                : "Unable to subscribe right now. Check your connection and try again.",
          invalid: code === "INVALID_EMAIL",
        });
        if (code === "INVALID_EMAIL") input.focus();
        return;
      }
      const messages = {
        confirmation_required: "Check your inbox to confirm the subscription.",
        confirmation_pending: "A confirmation email was already sent. Check your inbox.",
        already_subscribed: "This email address is already subscribed.",
        suppressed: "This address cannot receive blog email right now.",
      } satisfies Record<typeof payload.status, string>;
      setEmailState({ kind: "success", message: messages[payload.status] });
      input.value = "";
    } catch (error) {
      reportClientError("notifications.subscribeEmail", error);
      setEmailState({
        kind: "error",
        message: "Unable to subscribe right now. Check your connection and try again.",
      });
    }
  }

  async function handleEnablePush() {
    setPushState({ kind: "working", message: "Enabling notifications…" });
    try {
      const config = await getPushConfig();
      if (!config) {
        setPushState({
          kind: "unavailable",
          message: "Browser notifications are not configured on the server yet.",
        });
        return;
      }
      const permission =
        Notification.permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;
      if (permission !== "granted") {
        savePushDismissal();
        setPushState({
          kind: "blocked",
          message:
            "Notifications were not enabled. You can change this in the browser's site settings.",
        });
        return;
      }
      await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(config.publicKey),
        }));
      if (!(await persistPushSubscription(subscription))) {
        await subscription.unsubscribe();
        throw new Error("The push subscription could not be stored.");
      }
      clearPushDismissal();
      setPushState({
        kind: "subscribed",
        subscription,
        message: "Browser notifications are enabled.",
      });
    } catch (error) {
      reportClientError("notifications.enablePush", error);
      setPushState({
        kind: "error",
        message: "Unable to enable notifications. Check your connection and try again.",
      });
    }
  }

  async function handleTestPush(subscription: PushSubscription) {
    setPushTesting(true);
    try {
      if (!(await persistPushSubscription(subscription))) {
        throw new Error("The push subscription could not be synchronized.");
      }
      const response = await client.api.notifications.push.test.$post({
        json: { endpoint: subscription.endpoint },
      });
      if (!response.ok) {
        if (response.status === 404 || response.status === 410) {
          await subscription.unsubscribe();
          clearPushSync();
          setPushState({
            kind: "prompt",
            message: "This subscription expired. Enable notifications again.",
          });
          return;
        }
        throw new Error("The test notification could not be sent.");
      }
      setPushState({
        kind: "subscribed",
        subscription,
        message: "Test sent. Your browser should show it shortly.",
      });
    } catch (error) {
      reportClientError("notifications.testPush", error);
      setPushState({
        kind: "subscribed",
        subscription,
        message: "The test notification failed. Check browser and server settings.",
      });
    } finally {
      setPushTesting(false);
    }
  }

  async function handleDisablePush(subscription: PushSubscription) {
    setPushState({ kind: "working", message: "Disabling notifications…" });
    try {
      const response = await client.api.notifications.push.unsubscribe.$delete({
        json: { endpoint: subscription.endpoint },
      });
      if (!response.ok) throw new Error("The push subscription could not be disabled.");
      await subscription.unsubscribe();
      clearPushSync();
      setPushState({ kind: "prompt", message: "Browser notifications are disabled." });
    } catch (error) {
      reportClientError("notifications.disablePush", error);
      setPushState({
        kind: "subscribed",
        subscription,
        message: "Unable to disable notifications. Check your connection and try again.",
      });
    }
  }

  const emailError = emailState.kind === "error";
  const showPush = !["hidden", "unsupported", "checking"].includes(pushState.kind);

  return (
    <section aria-labelledby="blog-updates-heading" className="mt-8 py-5">
      <h2 id="blog-updates-heading" className="text-sm font-medium">
        Stay updated
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Get a short note when I publish something new. Your email or browser subscription is stored
        only to deliver these updates; unsubscribe anytime. No account or tracking profile required.
      </p>

      <form
        noValidate
        onSubmit={(event) => {
          void handleEmailSubmit(event);
        }}
        className="mt-4"
      >
        <label htmlFor={emailId} className="block text-xs font-medium">
          Get new posts by email
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            ref={emailRef}
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            disabled={emailState.kind === "submitting"}
            aria-invalid={emailState.invalid || undefined}
            aria-describedby={`${emailHelpId} ${emailStatusId}`}
            placeholder="email@example.com"
            className="min-h-10 min-w-0 flex-1 rounded-md border border-border bg-transparent px-3 text-sm placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          />
          <button
            type="submit"
            disabled={emailState.kind === "submitting"}
            aria-busy={emailState.kind === "submitting"}
            className="min-h-10 shrink-0 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity duration-150 hover:opacity-80 motion-safe:active:scale-[0.96] disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none"
          >
            {emailState.kind === "submitting" ? "Subscribing…" : "Subscribe"}
          </button>
        </div>
        <p id={emailHelpId} className="sr-only">
          A confirmation email is required before notifications begin.
        </p>
        <p
          id={emailStatusId}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={
            emailState.message
              ? `mt-2 text-xs ${emailError ? "text-red-600 dark:text-red-400" : "text-muted"}`
              : "sr-only"
          }
        >
          {emailState.message}
        </p>
      </form>

      {showPush ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium">Browser notifications</p>
            <p role="status" aria-live="polite" className="mt-1 text-xs leading-relaxed text-muted">
              {"message" in pushState && pushState.message
                ? pushState.message
                : pushState.kind === "subscribed"
                  ? "Enabled for this browser."
                  : "Get notified when I publish a new post."}
            </p>
          </div>
          {pushState.kind === "prompt" || pushState.kind === "error" ? (
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleEnablePush();
                }}
                className="min-h-10 rounded-md border border-border px-3 text-xs font-medium transition-colors duration-150 hover:bg-foreground/5 motion-safe:active:scale-[0.96] motion-reduce:transition-none"
              >
                Enable notifications
              </button>
              <button
                type="button"
                onClick={() => {
                  savePushDismissal();
                  setPushState({ kind: "hidden" });
                }}
                className="min-h-10 px-3 text-xs text-muted underline-offset-4 hover:text-foreground hover:underline"
              >
                Not now
              </button>
            </div>
          ) : null}
          {pushState.kind === "subscribed" ? (
            <div className="flex shrink-0 flex-wrap gap-2">
              {SHOW_PUSH_TEST ? (
                <button
                  type="button"
                  onClick={() => {
                    void handleTestPush(pushState.subscription);
                  }}
                  disabled={pushTesting}
                  className="min-h-10 rounded-md border border-border px-3 text-xs font-medium transition-colors duration-150 hover:bg-foreground/5 motion-safe:active:scale-[0.96] disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none"
                >
                  {pushTesting ? "Sending test…" : "Send test"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  void handleDisablePush(pushState.subscription);
                }}
                disabled={pushTesting}
                className="min-h-10 rounded-md border border-border px-3 text-xs text-muted transition-colors duration-150 hover:text-foreground motion-safe:active:scale-[0.96] disabled:opacity-50 motion-reduce:transition-none"
              >
                Disable notifications
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
