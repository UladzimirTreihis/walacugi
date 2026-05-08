import { doubleCsrf } from "csrf-csrf";
import type { Request } from "express";
import { cookieSameSite, isCookieSecure } from "./auth.js";

export const CSRF_COOKIE_NAME = "csrf_token";

const {
  doubleCsrfProtection,
  generateCsrfToken,
  invalidCsrfTokenError
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET as string,
  getSessionIdentifier: (req: Request) => req.ip ?? "unknown-ip",
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
