import { createHmac } from "node:crypto";

import { getAdminEnv } from "@portfolio/env/admin";

import { constantTimeEqual } from "./secure-compare";

const ADMIN_ACCESS_SESSION_VERSION = "v1";
export const ADMIN_ACCESS_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

function sign(payload: string) {
  return createHmac("sha256", getAdminEnv().accessKey).update(payload).digest("base64url");
}

export function createAdminAccessToken(now = Date.now()) {
  const expiresAt = Math.floor(now / 1_000) + ADMIN_ACCESS_SESSION_MAX_AGE_SECONDS;
  const payload = `${ADMIN_ACCESS_SESSION_VERSION}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminAccessKey(key: string) {
  return constantTimeEqual(key, getAdminEnv().accessKey);
}

export function verifyAdminAccessToken(token: string | undefined, now = Date.now()) {
  if (!token) return false;

  const [version, expiresAtValue, signature, ...extra] = token.split(".");
  if (
    version !== ADMIN_ACCESS_SESSION_VERSION ||
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
