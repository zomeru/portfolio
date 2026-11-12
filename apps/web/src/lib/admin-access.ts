import "@tanstack/react-start/server-only";
import {
  ADMIN_ACCESS_SESSION_MAX_AGE_SECONDS,
  createAdminAccessToken,
  verifyAdminAccessKey,
  verifyAdminAccessToken,
} from "@portfolio/api";
import { getCookie, getRequest, setCookie } from "@tanstack/react-start/server";

const ADMIN_ACCESS_COOKIE = "portfolio-admin-access-session";

export { verifyAdminAccessKey };

export async function createAdminAccessSession() {
  setCookie(ADMIN_ACCESS_COOKIE, createAdminAccessToken(), {
    httpOnly: true,
    maxAge: ADMIN_ACCESS_SESSION_MAX_AGE_SECONDS,
    path: "/admin",
    sameSite: "strict",
    secure: new URL(getRequest().url).protocol === "https:",
  });
}

export async function deleteAdminAccessSession() {
  setCookie(ADMIN_ACCESS_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/admin",
    sameSite: "strict",
    secure: new URL(getRequest().url).protocol === "https:",
  });
}

export async function isAdminAccessAuthenticated() {
  return verifyAdminAccessToken(getCookie(ADMIN_ACCESS_COOKIE));
}

export async function getAdminAccessSessionToken() {
  const token = getCookie(ADMIN_ACCESS_COOKIE);
  return verifyAdminAccessToken(token) ? token : undefined;
}
