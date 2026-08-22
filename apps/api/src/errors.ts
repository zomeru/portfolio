export type ApiErrorCode =
  | "BLOG_DUPLICATE"
  | "BLOG_GENERATION_FAILED"
  | "BLOG_GENERATION_INVALID"
  | "INVALID_IDEMPOTENCY_KEY"
  | "UNAUTHORIZED";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: 401 | 409 | 422 | 502;

  constructor(
    message: string,
    options: { code: ApiErrorCode; status: 401 | 409 | 422 | 502; cause?: unknown },
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status;
  }
}
