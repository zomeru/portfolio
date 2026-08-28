import "server-only";
import {
  ADMIN_ACCESS_SESSION_MAX_AGE_SECONDS,
  createAdminAccessToken,
  verifyAdminAccessKey,
  verifyAdminAccessToken,
} from "@portfolio/api";
import { cookies } from "next/headers";

const ADMIN_ACCESS_COOKIE = "portfolio-admin-access-session";

export { verifyAdminAccessKey };

export async function createAdminAccessSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_ACCESS_COOKIE, createAdminAccessToken(), {
    httpOnly: true,
    maxAge: ADMIN_ACCESS_SESSION_MAX_AGE_SECONDS,
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

export async function getAdminAccessSessionToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_ACCESS_COOKIE)?.value;
  return verifyAdminAccessToken(token) ? token : undefined;
}
