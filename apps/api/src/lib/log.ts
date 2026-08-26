import { AsyncLocalStorage } from "node:async_hooks";

type LogLevel = "error" | "info" | "warn";
type LogMetadata = Record<string, unknown>;

type SerializedError = {
  type: string;
  message: string;
  origin?: string;
  code?: string | number;
  status?: number;
  retryable?: boolean;
  providerRequestId?: string;
  providerMessage?: string;
  cause?: SerializedError;
  errors?: SerializedError[];
};

const logContext = new AsyncLocalStorage<LogMetadata>();
const MAX_ERROR_MESSAGE_LENGTH = 1_000;
const MAX_PROVIDER_MESSAGE_LENGTH = 1_000;
const MAX_ERROR_CAUSE_DEPTH = 3;
const ANSI_RESET = "\u001b[0m";
const ANSI_RED = "\u001b[31m";
const ANSI_ORANGE = "\u001b[38;5;208m";
const SENSITIVE_KEY_PATTERN =
  /^(authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|password|prompt|secret|token)$/i;

function redactSensitiveText(value: string) {
  return value
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1[REDACTED]")
    .replace(
      /((?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret|token)\s*[=:]\s*)[^\s,;]+/gi,
      "$1[REDACTED]",
    );
}

function truncate(value: string, maximumLength: number) {
  const redacted = redactSensitiveText(value);
  return redacted.length <= maximumLength
    ? redacted
    : `${redacted.slice(0, maximumLength)}…[truncated ${redacted.length - maximumLength} characters]`;
}

function applicationFrame(line: string) {
  let decoded = line.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep the original frame when a runtime emitted malformed URI escapes.
  }
  const source = decoded.match(
    /(?:\[project\]\/|\/)((?:apps|packages)\/[^+?)]+?\.[cm]?[jt]sx?)[^:\n]*:(\d+):(\d+)/,
  );
  if (!source) return null;
  const functionName = decoded.match(/^at\s+(?:async\s+)?([^(]+?)(?:\s+\(|$)/)?.[1]?.trim();
  return `at ${functionName || "anonymous"} (${source[1]}:${source[2]}:${source[3]})`;
}

function errorOrigin(stack: string | undefined) {
  const frames = stack
    ?.split("\n")
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!frames?.length) return undefined;

  for (const frame of frames) {
    const application = applicationFrame(frame);
    if (application) return application;
  }

  return frames.find(
    (frame) =>
      !frame.includes("node:internal") &&
      !frame.includes("node_modules") &&
      !frame.includes("processTicksAndRejections") &&
      !frame.includes("Promise.all") &&
      !frame.includes(".next/"),
  );
}

function errorCode(error: Error) {
  const candidate = (error as Error & { code?: unknown }).code;
  return typeof candidate === "string" || typeof candidate === "number" ? candidate : undefined;
}

function errorStatus(error: Error) {
  const candidate =
    (error as Error & { status?: unknown }).status ??
    (error as Error & { statusCode?: unknown }).statusCode;
  return typeof candidate === "number" ? candidate : undefined;
}

function errorRetryable(error: Error) {
  const candidate =
    (error as Error & { retryable?: unknown }).retryable ??
    (error as Error & { isRetryable?: unknown }).isRetryable;
  return typeof candidate === "boolean" ? candidate : undefined;
}

function errorProviderRequestId(error: Error) {
  const candidate =
    (error as Error & { requestId?: unknown }).requestId ??
    (error as Error & { requestID?: unknown }).requestID;
  return typeof candidate === "string" ? truncate(candidate, 256) : undefined;
}

function errorProviderMessage(error: Error) {
  const candidate =
    (error as Error & { body?: unknown; responseBody?: unknown }).body ??
    (error as Error & { responseBody?: unknown }).responseBody;
  if (typeof candidate === "string" && candidate.trim()) {
    return truncate(candidate.trim(), MAX_PROVIDER_MESSAGE_LENGTH);
  }
  if (Buffer.isBuffer(candidate) && candidate.byteLength > 0) {
    return truncate(candidate.toString("utf8").trim(), MAX_PROVIDER_MESSAGE_LENGTH);
  }
  return undefined;
}

export function serializeError(error: unknown, depth = 0): SerializedError {
  if (!(error instanceof Error)) {
    return {
      type: "NonErrorThrown",
      message: truncate(
        typeof error === "string" ? error : String(error),
        MAX_ERROR_MESSAGE_LENGTH,
      ),
    };
  }

  const origin = errorOrigin(error.stack);
  const code = errorCode(error);
  const status = errorStatus(error);
  const retryable = errorRetryable(error);
  const providerRequestId = errorProviderRequestId(error);
  const providerMessage = errorProviderMessage(error);
  const cause =
    depth < MAX_ERROR_CAUSE_DEPTH && error.cause !== undefined
      ? serializeError(error.cause, depth + 1)
      : undefined;
  const errors =
    depth < MAX_ERROR_CAUSE_DEPTH && error instanceof AggregateError
      ? error.errors.slice(0, 5).map((item) => serializeError(item, depth + 1))
      : undefined;

  return {
    type: error.name || "Error",
    message: truncate(error.message || "No error message provided", MAX_ERROR_MESSAGE_LENGTH),
    ...(origin ? { origin } : {}),
    ...(code !== undefined ? { code } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(retryable !== undefined ? { retryable } : {}),
    ...(providerRequestId ? { providerRequestId } : {}),
    ...(providerMessage ? { providerMessage } : {}),
    ...(cause ? { cause } : {}),
    ...(errors?.length ? { errors } : {}),
  };
}

export function errorLogMetadata(error: unknown, operation: string): LogMetadata {
  const serialized = serializeError(error);
  return {
    operation,
    errorType: serialized.type,
    errorMessage: serialized.message,
    ...(serialized.origin ? { errorOrigin: serialized.origin } : {}),
    error: serialized,
  };
}

export function logError(
  message: string,
  error: unknown,
  metadata: LogMetadata & { operation: string },
) {
  const { operation, ...context } = metadata;
  log("error", message, { ...context, ...errorLogMetadata(error, operation) });
}

export function logWarning(
  message: string,
  error: unknown,
  metadata: LogMetadata & { operation: string },
) {
  const { operation, ...context } = metadata;
  log("warn", message, { ...context, ...errorLogMetadata(error, operation) });
}

function sanitizeValue(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === "string") return redactSensitiveText(value);
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Error) return serializeError(value);
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, seen));

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : sanitizeValue(item, seen),
    ]),
  );
}

function sanitize(metadata: LogMetadata) {
  return sanitizeValue(metadata, new WeakSet()) as LogMetadata;
}

function shouldColor(stream: NodeJS.WriteStream) {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.NO_COLOR === undefined &&
    stream.isTTY === true
  );
}

function colorize(entry: string, level: LogLevel, stream: NodeJS.WriteStream) {
  if (!shouldColor(stream) || level === "info") return entry;
  return `${level === "error" ? ANSI_RED : ANSI_ORANGE}${entry}${ANSI_RESET}`;
}

export function withLogContext<T>(metadata: LogMetadata, callback: () => T): T {
  return logContext.run({ ...logContext.getStore(), ...sanitize(metadata) }, callback);
}

export function log(level: LogLevel, message: string, metadata: LogMetadata = {}) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    service: "portfolio-api",
    ...logContext.getStore(),
    ...sanitize(metadata),
  });

  if (level === "error") {
    console.error(colorize(entry, level, process.stderr));
    return;
  }

  if (level === "warn") {
    console.warn(colorize(entry, level, process.stderr));
    return;
  }

  console.log(entry);
}
