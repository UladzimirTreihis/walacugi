import type { CookieOptions, Response } from "express";

const AUTH_COOKIE_NAME = "auth_token";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * In production we run behind HTTPS and the frontend lives on a
 * different origin, so the session cookie must be `SameSite=None;
 * Secure`. In test/dev environments (HTTP localhost or supertest)
 * browsers and clients drop `Secure` cookies, so we relax both flags
 * to `lax`/non-secure. CSRF cookies follow the same rules.
 */
export function isCookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

export function cookieSameSite(): "none" | "lax" {
  return isCookieSecure() ? "none" : "lax";
}

export function authCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isCookieSecure(),
    sameSite: cookieSameSite(),
    path: "/",
    maxAge: ONE_DAY_MS
  };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions());
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions());
}

export const AUTH_TOKEN_COOKIE_NAME = AUTH_COOKIE_NAME;
