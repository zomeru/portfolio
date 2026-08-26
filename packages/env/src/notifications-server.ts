import { z } from "zod";

import { parseEnv } from "#utils";

const optionalSecret = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

const optionalAppPassword = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z
    .string()
    .transform((value) => value.replaceAll(/\s/g, ""))
    .pipe(z.string().min(16, "GOOGLE_APP_PASSWORD must contain 16 characters."))
    .optional(),
);

const notificationsServerSchema = z
  .object({
    EMAIL_PROVIDER: z.enum(["resend", "gmail"]).default("gmail"),
    RESEND_API_KEY: optionalSecret,
    EMAIL_FROM: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.email().optional(),
    ),
    EMAIL_FROM_NAME: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.string().trim().min(1).default("Zomer Gregorio"),
    ),
    EMAIL_REPLY_TO: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.email().optional(),
    ),
    EMAIL_CONFIRMATION_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(24),
    NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY: optionalSecret,
    WEB_PUSH_VAPID_PRIVATE_KEY: optionalSecret,
    WEB_PUSH_SUBJECT: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.union([z.url(), z.string().regex(/^mailto:[^\s@]+@[^\s@]+$/)]).optional(),
    ),
    NOTIFICATION_TOKEN_SECRET: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z
        .string()
        .min(32, "NOTIFICATION_TOKEN_SECRET must contain at least 32 characters.")
        .optional(),
    ),
    WEBHOOK_ENCRYPTION_KEY: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z
        .string()
        .refine(
          (value) => Buffer.from(value, "base64url").byteLength === 32,
          "WEBHOOK_ENCRYPTION_KEY must be a base64url-encoded 32-byte key.",
        )
        .optional(),
    ),
    GOOGLE_APP_PASSWORD: optionalAppPassword,
  })
  .superRefine((environment, context) => {
    const providerValues =
      environment.EMAIL_PROVIDER === "resend"
        ? [environment.RESEND_API_KEY, environment.EMAIL_FROM]
        : [environment.EMAIL_FROM, environment.GOOGLE_APP_PASSWORD];
    const emailRequested = Boolean(
      environment.EMAIL_FROM ||
      environment.EMAIL_REPLY_TO ||
      environment.RESEND_API_KEY ||
      environment.GOOGLE_APP_PASSWORD,
    );
    if (emailRequested && !providerValues.every(Boolean)) {
      const missing =
        environment.EMAIL_PROVIDER === "resend"
          ? environment.RESEND_API_KEY
            ? "EMAIL_FROM"
            : "RESEND_API_KEY"
          : environment.EMAIL_FROM
            ? "GOOGLE_APP_PASSWORD"
            : "EMAIL_FROM";
      context.addIssue({
        code: "custom",
        message:
          environment.EMAIL_PROVIDER === "resend"
            ? "RESEND_API_KEY and EMAIL_FROM must be configured together."
            : "EMAIL_FROM and GOOGLE_APP_PASSWORD must be configured together for Gmail.",
        path: [missing],
      });
    }

    const pushValues = [
      environment.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY,
      environment.WEB_PUSH_VAPID_PRIVATE_KEY,
      environment.WEB_PUSH_SUBJECT,
    ];
    if (pushValues.some(Boolean) && !pushValues.every(Boolean)) {
      context.addIssue({
        code: "custom",
        message:
          "NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY, WEB_PUSH_VAPID_PRIVATE_KEY, and WEB_PUSH_SUBJECT must be configured together.",
        path: ["NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY"],
      });
    }

    const anyFeatureConfigured =
      emailRequested || pushValues.some(Boolean) || Boolean(environment.WEBHOOK_ENCRYPTION_KEY);
    if (anyFeatureConfigured && !environment.NOTIFICATION_TOKEN_SECRET) {
      context.addIssue({
        code: "custom",
        message: "NOTIFICATION_TOKEN_SECRET is required when notifications are configured.",
        path: ["NOTIFICATION_TOKEN_SECRET"],
      });
    }
  });

export type NotificationsServerEnv = z.infer<typeof notificationsServerSchema>;

export function getNotificationsServerEnv(source: NodeJS.ProcessEnv = process.env) {
  return parseEnv(notificationsServerSchema, source);
}
