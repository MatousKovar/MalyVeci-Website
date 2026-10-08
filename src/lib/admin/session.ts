import "server-only";
import { cookies } from "next/headers";
import { hasEventStorageConfiguration } from "./event-storage";
import {
  isPasswordHashValid,
  isSessionSecretValid,
  SESSION_DURATION_MS,
  signAdminSession,
  verifyAdminSession,
} from "./session-crypto.mjs";

const ADMIN_SESSION_COOKIE = "admin_session";

function getConfiguredAdminSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return typeof secret === "string" && isSessionSecretValid(secret)
    ? secret
    : undefined;
}

export function hasAdminConfiguration() {
  return (
    isPasswordHashValid(process.env.ADMIN_PASSWORD_HASH) &&
    getConfiguredAdminSessionSecret() !== undefined &&
    hasEventStorageConfiguration()
  );
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const secret = getConfiguredAdminSessionSecret();
  if (!secret) return false;

  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return token ? verifyAdminSession(secret, token) : false;
}

export class AdminUnauthorizedError extends Error {
  constructor() {
    super("Administrator authentication is required.");
    this.name = "AdminUnauthorizedError";
  }
}

export async function requireAdminSession() {
  if (!(await isAdminAuthenticated())) {
    throw new AdminUnauthorizedError();
  }
}

export async function createAdminSession() {
  const secret = getConfiguredAdminSessionSecret();
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured correctly.");
  }

  const expires = new Date(Date.now() + SESSION_DURATION_MS);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, signAdminSession(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
