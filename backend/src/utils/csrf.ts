import { doubleCsrf } from "csrf-csrf";
import type { Request } from "express";
import { AUTH_TOKEN_COOKIE_NAME, cookieSameSite, isCookieSecure } from "./auth.js";

export const CSRF_COOKIE_NAME = "csrf_token";

/**
 * Bind CSRF tokens to the admin JWT (stable across Railway edge hops),
 * not to `req.ip` — proxy/IP changes were causing intermittent 403
 * `invalid csrf token` on POST /api/events.
 */
function csrfSessionIdentifier(req: Request): string {
  const token = req.cookies?.[AUTH_TOKEN_COOKIE_NAME];
  if (typeof token === "string" && token.length > 0) {
    return token;
  }
  return "anonymous";
}

const {
  doubleCsrfProtection,
  generateCsrfToken,
  invalidCsrfTokenError
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET as string,
  getSessionIdentifier: csrfSessionIdentifier,
  cookieName: CSRF_COOKIE_NAME,
  cookieOptions: {
    sameSite: cookieSameSite(),
    secure: isCookieSecure(),
    httpOnly: false,
    path: "/"
  },
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getCsrfTokenFromRequest: (req: Request) => req.headers["x-csrf-token"]
});

export { doubleCsrfProtection, generateCsrfToken, invalidCsrfTokenError };
