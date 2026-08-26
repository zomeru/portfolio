export class NotificationDeliveryError extends Error {
  readonly code: string;
  readonly httpStatus: number | undefined;
  readonly retryable: boolean;
  readonly staleDestination: boolean;

  constructor(
    message: string,
    options: {
      code: string;
      httpStatus?: number;
      retryable?: boolean;
      staleDestination?: boolean;
      cause?: unknown;
    },
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "NotificationDeliveryError";
    this.code = options.code;
    this.httpStatus = options.httpStatus;
    this.retryable = options.retryable ?? true;
    this.staleDestination = options.staleDestination ?? false;
  }
}
