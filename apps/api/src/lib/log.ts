import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";

import { recordApplicationError } from "@portfolio/database";

type LogLevel = "error" | "info" | "warn";
type LogMetadata = Record<string, unknown>;

type SerializedError = {
  type: string;
  message: string;
  stack?: string;
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
const MAX_STACK_FRAME_LENGTH = 4_096;
const MAX_STACK_LENGTH = 16_000;
const MAX_METADATA_DEPTH = 5;
const MAX_METADATA_ARRAY_ITEMS = 25;
const MAX_METADATA_KEYS = 50;
const MAX_METADATA_STRING_LENGTH = 2_000;
const MAX_METADATA_JSON_LENGTH = 32_000;
const ANSI_RESET = "\u001b[0m";
const ANSI_RED = "\u001b[31m";
const ANSI_ORANGE = "\u001b[38;5;208m";
const SENSITIVE_KEY_PATTERN =
  /(?:authorization|cookie|password|passphrase|prompt|secret|^token$|(?:api|access|refresh|session|auth)[_-]?(?:key|token)|private[_-]?key|client[_-]?secret|database[_-]?url|connection[_-]?string|credential)/i;
const errorPersistence = new WeakMap<Error, Promise<void>>();

function redactSensitiveText(value: string) {
  return value
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1[REDACTED]")
    .replace(/\bpostgres(?:ql)?:\/\/[^\s)]+/gi, "[REDACTED_DATABASE_URL]")
    .replace(/([?&](?:api[_-]?key|key|secret|signature|token)=)[^&\s]+/gi, "$1[REDACTED]")
    .replace(
      /((?:authorization|cookie|set-cookie|api[_-]?key|access[_-]?token|refresh[_-]?token|session[_-]?(?:key|token)|password|secret|token)\s*[=:]\s*)[^\s,;]+/gi,
      "$1[REDACTED]",
    );
}

function truncate(value: string, maximumLength: number) {
  const redacted = redactSensitiveText(value);
  return redacted.length <= maximumLength
    ? redacted
    : `${redacted.slice(0, maximumLength)}…[truncated ${redacted.length - maximumLength} characters]`;
}

function containsOnlyAsciiDigits(value: string) {
  if (value.length === 0) return false;
  for (const character of value) {
    if (character < "0" || character > "9") return false;
  }
  return true;
}

function applicationFrame(line: string) {
  let decoded = line.trim().slice(0, MAX_STACK_FRAME_LENGTH);
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep the original frame when a runtime emitted malformed URI escapes.
  }

  const sourceStart = ["/apps/", "/packages/"]
    .map((marker) => decoded.indexOf(marker))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0];
  if (sourceStart === undefined) return null;
  const sourcePathStart = sourceStart + 1;

  const sourceExtensions = [".tsx", ".jsx", ".mts", ".cts", ".mjs", ".cjs", ".ts", ".js"];
  for (let separator = decoded.indexOf(":", sourcePathStart); separator >= 0;) {
    const lineEnd = decoded.indexOf(":", separator + 1);
    if (lineEnd < 0) return null;

    const lineNumber = decoded.slice(separator + 1, lineEnd);
    let columnEnd = lineEnd + 1;
    while (columnEnd < decoded.length) {
      const character = decoded.charCodeAt(columnEnd);
      if (character < 48 || character > 57) break;
      columnEnd += 1;
    }
    const columnNumber = decoded.slice(lineEnd + 1, columnEnd);
    const source = decoded.slice(sourcePathStart, separator);
    const suffixStart = source.search(/[+?)]/);
    const sourcePath = suffixStart >= 0 ? source.slice(0, suffixStart) : source;

    if (
      containsOnlyAsciiDigits(lineNumber) &&
      containsOnlyAsciiDigits(columnNumber) &&
      sourceExtensions.some((extension) => sourcePath.endsWith(extension))
    ) {
      let functionName = "anonymous";
      if (decoded.startsWith("at ")) {
        const nameStart = decoded.startsWith("at async ") ? 9 : 3;
        const nameEnd = decoded.indexOf(" (", nameStart);
        if (nameEnd >= 0 && nameEnd <= sourcePathStart) {
          functionName = decoded.slice(nameStart, nameEnd).trim() || functionName;
        }
      }
      return `at ${functionName} (${sourcePath}:${lineNumber}:${columnNumber})`;
    }

    separator = decoded.indexOf(":", lineEnd + 1);
  }
  return null;
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
    ...(error.stack ? { stack: truncate(error.stack, MAX_STACK_LENGTH) } : {}),
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
  void persistError(error, { ...context, operation, event: message });
}

export async function captureError(
  message: string,
  error: unknown,
  metadata: LogMetadata & { operation: string },
) {
  const { operation, ...context } = metadata;
  log("error", message, { ...context, ...errorLogMetadata(error, operation) });
  await persistError(error, { ...context, operation, event: message });
}

export function logWarning(
  message: string,
  error: unknown,
  metadata: LogMetadata & { operation: string },
) {
  const { operation, ...context } = metadata;
  log("warn", message, { ...context, ...errorLogMetadata(error, operation) });
}

function sanitizeValue(value: unknown, seen: WeakSet<object>, depth = 0): unknown {
  if (typeof value === "string") return truncate(value, MAX_METADATA_STRING_LENGTH);
  if (typeof value === "bigint") return value.toString();
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Error) return serializeError(value);
  if (depth >= MAX_METADATA_DEPTH) return "[Depth limited]";
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_METADATA_ARRAY_ITEMS)
      .map((item) => sanitizeValue(item, seen, depth + 1));
    if (value.length > MAX_METADATA_ARRAY_ITEMS) {
      items.push(`[${value.length - MAX_METADATA_ARRAY_ITEMS} more items]`);
    }
    return items;
  }

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, MAX_METADATA_KEYS)
      .map(([key, item]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : sanitizeValue(item, seen, depth + 1),
      ]),
  );
}

function sanitize(metadata: LogMetadata) {
  return sanitizeValue(metadata, new WeakSet()) as LogMetadata;
}

function existingErrorPersistence(error: unknown, depth = 0): Promise<void> | undefined {
  if (!(error instanceof Error) || depth > MAX_ERROR_CAUSE_DEPTH) return undefined;
  return errorPersistence.get(error) ?? existingErrorPersistence(error.cause, depth + 1);
}

function markErrorChain(error: unknown, persistence: Promise<void>, depth = 0) {
  if (!(error instanceof Error) || depth > MAX_ERROR_CAUSE_DEPTH) return;
  errorPersistence.set(error, persistence);
  markErrorChain(error.cause, persistence, depth + 1);
}

function normalizedFingerprintText(value: string) {
  return value
    .toLowerCase()
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, "{uuid}")
    .replace(/\b\d{3,}\b/g, "{number}")
    .replace(/\s+/g, " ")
    .trim();
}

function boundedRecord(value: LogMetadata) {
  const json = JSON.stringify(value);
  if (json.length <= MAX_METADATA_JSON_LENGTH) return value;
  return {
    truncated: true,
    originalLength: json.length,
    preview: truncate(json, MAX_METADATA_JSON_LENGTH / 2),
  };
}

async function persistErrorRecord(error: unknown, metadata: LogMetadata) {
  const serialized = serializeError(error);
  const context = sanitize({ ...logContext.getStore(), ...metadata });
  const route = typeof context.route === "string" ? context.route : context.path;
  const method = typeof context.method === "string" ? context.method : undefined;
  const requestId = typeof context.requestId === "string" ? context.requestId : undefined;
  const userAgent = typeof context.userAgent === "string" ? context.userAgent : undefined;
  const service =
    typeof context.service === "string"
      ? context.service
      : typeof context.operation === "string" && context.operation.startsWith("web.")
        ? "portfolio-web"
        : "portfolio-api";
  const errorCode =
    serialized.code === undefined
      ? typeof context.errorCode === "string"
        ? context.errorCode
        : undefined
      : String(serialized.code);
  const fingerprint = createHash("sha256")
    .update(
      [
        serialized.type,
        normalizedFingerprintText(serialized.message),
        serialized.origin ?? "",
        serialized.cause?.type ?? "",
        normalizedFingerprintText(serialized.cause?.message ?? ""),
        typeof route === "string" ? route : "",
      ].join("\n"),
    )
    .digest("hex");

  const reservedKeys = new Set([
    "errorCode",
    "method",
    "path",
    "requestId",
    "route",
    "service",
    "userAgent",
  ]);
  const storedMetadata = Object.fromEntries(
    Object.entries(context).filter(([key]) => !reservedKeys.has(key)),
  );

  try {
    await recordApplicationError({
      fingerprint,
      severity: "error",
      name: truncate(serialized.type, 255),
      message: serialized.message,
      ...(serialized.stack ? { stack: serialized.stack } : {}),
      ...(serialized.origin ? { source: truncate(serialized.origin, 1_024) } : {}),
      ...(typeof route === "string" ? { route: truncate(route, 512) } : {}),
      ...(method ? { method: truncate(method, 16) } : {}),
      ...(requestId ? { requestId: truncate(requestId, 255) } : {}),
      ...(userAgent ? { userAgent: truncate(userAgent, 1_024) } : {}),
      environment: truncate(process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development", 64),
      service: truncate(service, 100),
      ...(errorCode ? { errorCode: truncate(errorCode, 255) } : {}),
      metadata: boundedRecord(storedMetadata),
      ...(serialized.cause ? { cause: boundedRecord(serialized.cause as LogMetadata) } : {}),
    });
  } catch (loggingError) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "failed to persist application error log",
        service: "portfolio-api",
        loggingError: serializeError(loggingError),
        originalError: { type: serialized.type, message: serialized.message },
      }),
    );
  }
}

async function persistError(error: unknown, metadata: LogMetadata) {
  const existing = existingErrorPersistence(error);
  if (existing) return existing;
  const persistence = persistErrorRecord(error, metadata);
  markErrorChain(error, persistence);
  await persistence;
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
