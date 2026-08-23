import { createHmac } from "node:crypto";
import { getAssistantServerEnv } from "@portfolio/env/assistant-server";
import { getCronEnv } from "@portfolio/env/cron";
import { constantTimeEqual } from "./secure-compare";

const SESSION_VERSION = "v2";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
export type AdminCapability = "ai-reindex" | "blog-generation";

function getCapabilitySecret(capability: AdminCapability) {
  return capability === "blog-generation" ? getCronEnv().secret : getAssistantServerEnv().apiKey;
}

function sign(payload: string, capability: AdminCapability) {
  return createHmac("sha256", getCapabilitySecret(capability)).update(payload).digest("base64url");
}

export function verifyAdminSecret(secret: string, capability: AdminCapability) {
  return constantTimeEqual(secret, getCapabilitySecret(capability));
}

export function createAdminSessionToken(capability: AdminCapability, now = Date.now()) {
  const expiresAt = Math.floor(now / 1_000) + ADMIN_SESSION_MAX_AGE_SECONDS;
  const payload = `${SESSION_VERSION}.${capability}.${expiresAt}`;

  return `${payload}.${sign(payload, capability)}`;
}

export function verifyAdminSessionToken(
  token: string | undefined,
  capability: AdminCapability,
  now = Date.now(),
) {
  if (!token) return false;

  const [version, tokenCapability, expiresAtValue, signature, ...extra] = token.split(".");
  if (
    version !== SESSION_VERSION ||
    tokenCapability !== capability ||
    !expiresAtValue ||
    !signature ||
    extra.length > 0 ||
    !/^\d+$/.test(expiresAtValue)
  ) {
    return false;
  }

  const expiresAt = Number(expiresAtValue);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(now / 1_000)) return false;

  return constantTimeEqual(
    signature,
    sign(`${version}.${tokenCapability}.${expiresAtValue}`, capability),
  );
}
