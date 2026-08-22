const SENSITIVE_KEY_PATTERN = /authorization|content|key|prompt|secret|token/i;

function sanitize(metadata: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : value,
    ]),
  );
}

export function log(
  level: "error" | "info" | "warn",
  message: string,
  metadata: Record<string, unknown> = {},
) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    service: "portfolio-api",
    ...sanitize(metadata),
  });

  if (level === "error") {
    console.error(entry);
    return;
  }

  if (level === "warn") {
    console.warn(entry);
    return;
  }

  console.log(entry);
}
