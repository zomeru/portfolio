import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { getAdminEnv } from "@portfolio/env/admin";
import { cookies } from "next/headers";

const ADMIN_ACCESS_COOKIE = "portfolio-admin-access-session";
const ADMIN_ACCESS_SESSION_VERSION = "v1";
const ADMIN_ACCESS_MAX_AGE_SECONDS = 8 * 60 * 60;

function sign(payload: string) {
  return createHmac("sha256", getAdminEnv().accessKey).update(payload).digest("base64url");
}

function constantTimeEqual(left: string, right: string) {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

function createAdminAccessToken(now = Date.now()) {
  const expiresAt = Math.floor(now / 1_000) + ADMIN_ACCESS_MAX_AGE_SECONDS;
  const payload = `${ADMIN_ACCESS_SESSION_VERSION}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function verifyAdminAccessToken(token: string | undefined, now = Date.now()) {
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

export function verifyAdminAccessKey(key: string) {
  return constantTimeEqual(key, getAdminEnv().accessKey);
}

export async function createAdminAccessSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_ACCESS_COOKIE, createAdminAccessToken(), {
    httpOnly: true,
    maxAge: ADMIN_ACCESS_MAX_AGE_SECONDS,
    path: "/admin",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function deleteAdminAccessSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_ACCESS_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/admin",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function isAdminAccessAuthenticated() {
  const cookieStore = await cookies();
  return verifyAdminAccessToken(cookieStore.get(ADMIN_ACCESS_COOKIE)?.value);
}
