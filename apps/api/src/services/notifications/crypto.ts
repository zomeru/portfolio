import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";

import { getNotificationsServerEnv } from "@portfolio/env/notifications-server";

import { constantTimeEqual } from "../../lib/secure-compare";

export function createSecretToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getTokenSecret() {
  const secret = getNotificationsServerEnv().notificationTokenSecret;
  if (!secret) throw new Error("Notification token signing is not configured.");
  return secret;
}

export function keyedHash(value: string) {
  return createHmac("sha256", getTokenSecret()).update(value).digest("hex");
}

export function createUnsubscribeToken(subscriptionId: string, version: number) {
  const value = `${subscriptionId}.${version}`;
  return `${value}.${keyedHash(`unsubscribe:${value}`)}`;
}

export function parseUnsubscribeToken(token: string) {
  const [subscriptionId, versionText, signature, ...rest] = token.split(".");
  const version = Number(versionText);
  if (
    rest.length > 0 ||
    !subscriptionId ||
    !Number.isSafeInteger(version) ||
    version < 1 ||
    !signature
  ) {
    return null;
  }
  const expected = keyedHash(`unsubscribe:${subscriptionId}.${version}`);
  return constantTimeEqual(signature, expected) ? { subscriptionId, version } : null;
}

export function signWebhookPayload(secret: string, timestamp: string, rawBody: string) {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

export function verifyWebhookSignature(options: {
  rawBody: string;
  timestamp: string;
  signature: string;
  secret: string;
  toleranceSeconds?: number;
  now?: Date;
}) {
  const timestampSeconds = Number(options.timestamp);
  if (!Number.isSafeInteger(timestampSeconds)) return false;
  const nowSeconds = Math.floor((options.now ?? new Date()).getTime() / 1_000);
  if (Math.abs(nowSeconds - timestampSeconds) > (options.toleranceSeconds ?? 300)) return false;
  const expected = `v1=${signWebhookPayload(options.secret, options.timestamp, options.rawBody)}`;
  return constantTimeEqual(options.signature, expected);
}

function getEncryptionKey() {
  const encoded = getNotificationsServerEnv().webhookEncryptionKey;
  if (!encoded) throw new Error("Webhook encryption is not configured.");
  return Buffer.from(encoded, "base64url");
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptSecret(value: string) {
  const [ivText, tagText, encryptedText, ...rest] = value.split(".");
  if (!ivText || !tagText || !encryptedText || rest.length > 0) {
    throw new Error("Encrypted notification secret is malformed.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivText, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
