type ClientLogMetadata = Record<string, unknown>;

function normalizedError(error: unknown) {
  if (error instanceof Error) {
    return {
      type: error.name,
      message: error.message,
      ...(error.cause instanceof Error
        ? { cause: { type: error.cause.name, message: error.cause.message } }
        : {}),
    };
  }
  return { type: "NonErrorThrown", message: String(error) };
}

export function reportClientError(
  operation: string,
  error: unknown,
  metadata: ClientLogMetadata = {},
) {
  console.error(`[portfolio-web] ${operation} failed`, {
    operation,
    ...metadata,
    error: normalizedError(error),
  });
}

export function reportClientWarning(
  operation: string,
  error: unknown,
  metadata: ClientLogMetadata = {},
) {
  console.warn(`[portfolio-web] ${operation} warning`, {
    operation,
    ...metadata,
    error: normalizedError(error),
  });
}
