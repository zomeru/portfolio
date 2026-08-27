"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("Blogs.notifications");
  const emailId = useId();
  const emailHelpId = useId();
  const emailStatusId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const [emailState, setEmailState] = useState<EmailState>(() => {
    if (initialNotice === "confirmed") {
      return { kind: "success", message: t("confirmed") };
    }
    if (initialNotice === "invalid") {
      return { kind: "error", message: t("invalidConfirmation") };
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
            message: t("notConfigured"),
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
            message: t("keysChanged"),
          });
          return;
        }
        if (subscription) {
          const recentlySynced = Date.now() - getLastPushSync() < PUSH_SYNC_TTL_MS;
          if (!recentlySynced && !(await persistPushSubscription(subscription))) {
            setPushState({
              kind: "error",
              message: t("syncError"),
            });
            return;
          }
          setPushState({ kind: "subscribed", subscription });
          return;
        }
        if (Notification.permission === "denied") {
          setPushState({
            kind: "blocked",
            message: t("blocked"),
          });
          return;
        }
        const { ios, standalone } = getIosInstallState();
        if (ios && !standalone) {
          setPushState({
            kind: "ios-install",
            message: t("iosInstall"),
          });
          return;
        }
        setPushState(hasRecentPushDismissal() ? { kind: "hidden" } : { kind: "prompt" });
      } catch (error) {
        reportClientError("notifications.initializePush", error);
        if (active) {
          setPushState({
            kind: "unavailable",
            message: t("statusError"),
          });
        }
      }
    }
    void initializePush();
    return () => {
      active = false;
    };
  }, [t]);

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = emailRef.current;
    if (!input?.validity.valid) {
      setEmailState({ kind: "error", message: t("invalidEmail"), invalid: true });
      input?.focus();
      return;
    }
    setEmailState({ kind: "submitting", message: t("subscribing") });
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
              ? t("rateLimited")
              : code === "INVALID_EMAIL"
                ? t("invalidEmail")
                : t("subscribeError"),
          invalid: code === "INVALID_EMAIL",
        });
        if (code === "INVALID_EMAIL") input.focus();
        return;
      }
      setEmailState({
        kind: "success",
        message: t("checkInbox"),
      });
      input.value = "";
    } catch (error) {
      reportClientError("notifications.subscribeEmail", error);
      setEmailState({
        kind: "error",
        message: t("subscribeError"),
      });
    }
  }

  async function handleEnablePush() {
    setPushState({ kind: "working", message: t("enabling") });
    try {
      const config = await getPushConfig();
      if (!config) {
        setPushState({
          kind: "unavailable",
          message: t("notConfigured"),
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
          message: t("permissionDenied"),
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
        message: t("enabled"),
      });
    } catch (error) {
      reportClientError("notifications.enablePush", error);
      setPushState({
        kind: "error",
        message: t("enableError"),
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
            message: t("expired"),
          });
          return;
        }
        throw new Error("The test notification could not be sent.");
      }
      setPushState({
        kind: "subscribed",
        subscription,
        message: t("testSent"),
      });
    } catch (error) {
      reportClientError("notifications.testPush", error);
      setPushState({
        kind: "subscribed",
        subscription,
        message: t("testError"),
      });
    } finally {
      setPushTesting(false);
    }
  }

  async function handleDisablePush(subscription: PushSubscription) {
    setPushState({ kind: "working", message: t("disabling") });
    try {
      const response = await client.api.notifications.push.unsubscribe.$delete({
        json: { endpoint: subscription.endpoint },
      });
      if (!response.ok) throw new Error("The push subscription could not be disabled.");
      await subscription.unsubscribe();
      clearPushSync();
      setPushState({ kind: "prompt", message: t("disabled") });
    } catch (error) {
      reportClientError("notifications.disablePush", error);
      setPushState({
        kind: "subscribed",
        subscription,
        message: t("disableError"),
      });
    }
  }

  const emailError = emailState.kind === "error";
  const showPush = !["hidden", "unsupported", "checking"].includes(pushState.kind);

  return (
    <section aria-labelledby="blog-updates-heading" className="mt-8 py-5">
      <h2 id="blog-updates-heading" className="text-sm font-medium">
        {t("heading")}
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">{t("description")}</p>

      <form
        noValidate
        onSubmit={(event) => {
          void handleEmailSubmit(event);
        }}
        className="mt-4"
      >
        <label htmlFor={emailId} className="block text-xs font-medium">
          {t("emailLabel")}
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
            {emailState.kind === "submitting" ? t("subscribing") : t("subscribe")}
          </button>
        </div>
        <p id={emailHelpId} className="sr-only">
          {t("emailHelp")}
        </p>
        <p
          id={emailStatusId}
          role={emailError ? "alert" : "status"}
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
            <p className="text-xs font-medium">{t("browserHeading")}</p>
            <p role="status" aria-live="polite" className="mt-1 text-xs leading-relaxed text-muted">
              {"message" in pushState && pushState.message
                ? pushState.message
                : pushState.kind === "subscribed"
                  ? t("browserEnabled")
                  : t("browserPrompt")}
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
                {t("enable")}
              </button>
              <button
                type="button"
                onClick={() => {
                  savePushDismissal();
                  setPushState({ kind: "hidden" });
                }}
                className="min-h-10 px-3 text-xs text-muted underline-offset-4 hover:text-foreground hover:underline"
              >
                {t("notNow")}
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
                  {pushTesting ? t("sendingTest") : t("sendTest")}
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
                {t("disable")}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
