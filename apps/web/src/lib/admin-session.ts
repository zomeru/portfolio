import "@tanstack/react-start/server-only";
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  type AdminCapability,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "@portfolio/api";
import { getCookie, getRequest, setCookie } from "@tanstack/react-start/server";

const ADMIN_SESSION_COOKIES: Record<AdminCapability, string> = {
  "ai-reindex": "portfolio-admin-ai-reindex-session",
  "blog-generation": "portfolio-admin-blog-generation-session",
};

export async function createAdminSession(capability: AdminCapability) {
  setCookie(ADMIN_SESSION_COOKIES[capability], createAdminSessionToken(capability), {
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/admin",
    sameSite: "strict",
    secure: new URL(getRequest().url).protocol === "https:",
  });
}

export async function deleteAdminSession(capability: AdminCapability) {
  setCookie(ADMIN_SESSION_COOKIES[capability], "", {
    httpOnly: true,
    maxAge: 0,
    path: "/admin",
    sameSite: "strict",
    secure: new URL(getRequest().url).protocol === "https:",
  });
}

export async function isAdminAuthenticated(capability: AdminCapability) {
  return Boolean(await getAdminSessionToken(capability));
}

export async function getAdminSessionToken(capability: AdminCapability) {
  const token = getCookie(ADMIN_SESSION_COOKIES[capability]);
  return verifyAdminSessionToken(token, capability) ? token : undefined;
}
