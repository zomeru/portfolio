import "server-only";

import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  type AdminCapability,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "@portfolio/api";
import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIES: Record<AdminCapability, string> = {
  "ai-reindex": "portfolio-admin-ai-reindex-session",
  "blog-generation": "portfolio-admin-blog-generation-session",
};

export async function createAdminSession(capability: AdminCapability) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIES[capability], createAdminSessionToken(capability), {
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/admin",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function deleteAdminSession(capability: AdminCapability) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIES[capability], "", {
    httpOnly: true,
    maxAge: 0,
    path: "/admin",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function isAdminAuthenticated(capability: AdminCapability) {
  return Boolean(await getAdminSessionToken(capability));
}

export async function getAdminSessionToken(capability: AdminCapability) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIES[capability])?.value;
  return verifyAdminSessionToken(token, capability) ? token : undefined;
}
