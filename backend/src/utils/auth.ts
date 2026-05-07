import type { Response } from "express";

const AUTH_COOKIE_NAME = "auth_token";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function cookieBaseOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    path: "/",
    maxAge: ONE_DAY_MS
  };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, cookieBaseOptions());
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, cookieBaseOptions());
}

export const AUTH_TOKEN_COOKIE_NAME = AUTH_COOKIE_NAME;
