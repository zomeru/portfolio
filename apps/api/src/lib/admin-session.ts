import { createHmac } from "node:crypto";
import { getCronEnv } from "@portfolio/env/cron";
import { constantTimeEqual } from "./secure-compare";

const SESSION_VERSION = "v1";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

function sign(payload: string) {
  return createHmac("sha256", getCronEnv().secret).update(payload).digest("base64url");
}

export function verifyAdminSecret(secret: string) {
  return constantTimeEqual(secret, getCronEnv().secret);
}

export function createAdminSessionToken(now = Date.now()) {
  const expiresAt = Math.floor(now / 1_000) + ADMIN_SESSION_MAX_AGE_SECONDS;
  const payload = `${SESSION_VERSION}.${expiresAt}`;

  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionToken(token: string | undefined, now = Date.now()) {
  if (!token) return false;

  const [version, expiresAtValue, signature, ...extra] = token.split(".");
  if (
    version !== SESSION_VERSION ||
    !expiresAtValue ||
    !signature ||
    extra.length > 0 ||
    !/^\d+$/.test(expiresAtValue)
  ) {
    return false;
  }

  const expiresAt = Number(expiresAtValue);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(now / 1_000)) return false;

  return constantTimeEqual(signature, sign(`${version}.${expiresAtValue}`));
}
