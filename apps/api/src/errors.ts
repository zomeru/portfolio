export type ApiErrorCode =
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_RATE_LIMITED"
  | "AI_REQUEST_INVALID"
  | "ADMIN_REQUEST_INVALID"
  | "BLOG_GENERATION_FAILED"
  | "BLOG_GENERATION_INVALID"
  | "GITHUB_CONFIGURATION_ERROR"
  | "GITHUB_RATE_LIMITED"
  | "GITHUB_REQUEST_FAILED"
  | "INGESTION_ALREADY_RUNNING"
  | "INGESTION_FAILED"
  | "INVALID_IDEMPOTENCY_KEY"
  | "UNAUTHORIZED";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: 400 | 401 | 409 | 413 | 422 | 429 | 502 | 503;

  constructor(
    message: string,
    options: {
      code: ApiErrorCode;
      status: 400 | 401 | 409 | 413 | 422 | 429 | 502 | 503;
      cause?: unknown;
    },
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status;
  }
}
