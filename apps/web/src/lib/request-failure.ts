const requestFailureKinds = [
  "offline",
  "network",
  "timeout",
  "server",
  "rateLimit",
  "authentication",
  "authorization",
  "validation",
  "notFound",
  "unavailable",
  "unknown",
] as const;

export type RequestFailureKind = (typeof requestFailureKinds)[number];

export class HttpRequestError extends Error {
  readonly code: string | undefined;
  readonly status: number;

  constructor(status: number, code?: string) {
    super(`Request failed with status ${status}.`);
    this.name = "HttpRequestError";
    this.status = status;
    this.code = code;
  }
}

function kindFromStatus(status: number): RequestFailureKind {
  if (status === 400 || status === 413 || status === 422) return "validation";
  if (status === 401) return "authentication";
  if (status === 403) return "authorization";
  if (status === 404 || status === 410) return "notFound";
  if (status === 408 || status === 504) return "timeout";
  if (status === 429) return "rateLimit";
  if (status === 502 || status === 503) return "unavailable";
  if (status >= 500) return "server";
  return "unknown";
}

function kindFromCode(code: string | undefined): RequestFailureKind | undefined {
  if (!code) return undefined;
  if (code.includes("RATE_LIMIT")) return "rateLimit";
  if (code === "UNAUTHORIZED") return "authentication";
  if (code === "FORBIDDEN") return "authorization";
  if (code.includes("NOT_FOUND")) return "notFound";
  if (code.includes("INVALID") || code === "PAYLOAD_TOO_LARGE") return "validation";
  if (code.includes("TIMEOUT")) return "timeout";
  if (code.includes("UNAVAILABLE") || code.includes("CONFIGURATION")) return "unavailable";
  return undefined;
}

export function classifyRequestFailure(error: unknown): RequestFailureKind {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";

  if (error instanceof HttpRequestError) {
    return kindFromCode(error.code) ?? kindFromStatus(error.status);
  }

  const message = error instanceof Error ? error.message.toLocaleLowerCase() : "";
  if (/\b429\b|rate.?limit|too many requests/.test(message)) return "rateLimit";
  if (/\b401\b|unauthori[sz]ed/.test(message)) return "authentication";
  if (/\b403\b|forbidden/.test(message)) return "authorization";
  if (/\b408\b|\b504\b|timed?\s*out|timeout/.test(message)) return "timeout";
  if (/\b502\b|\b503\b|temporarily unavailable/.test(message)) return "unavailable";
  if (/\b5\d\d\b|internal server/.test(message)) return "server";
  if (error instanceof TypeError) return "network";
  return "unknown";
}
