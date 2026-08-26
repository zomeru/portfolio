import { z } from "zod";

import { parseEnv } from "#utils";

const optionalPublicKey = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(40).optional(),
);

const notificationsClientSchema = z.object({
  NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY: optionalPublicKey,
});

export type NotificationsClientEnv = z.infer<typeof notificationsClientSchema>;

export function getNotificationsClientEnv(source: NodeJS.ProcessEnv = process.env) {
  return parseEnv(notificationsClientSchema, source);
}
