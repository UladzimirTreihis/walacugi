import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload, VerifyErrors } from "jsonwebtoken";
import { HttpError } from "./httpErrors.js";
import { AUTH_TOKEN_COOKIE_NAME } from "./auth.js";

export function checkAdminToken(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[AUTH_TOKEN_COOKIE_NAME];
  if (!token) {
    next(new HttpError(401, "Unauthorized"));
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    next(new HttpError(500, "Server misconfiguration"));
    return;
  }

  jwt.verify(token, secret, (err: VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
    if (err || !decoded || typeof decoded !== "object" || (decoded as { role?: unknown }).role !== "admin") {
      next(new HttpError(401, "Unauthorized"));
      return;
    }

    req.admin = decoded;
    next();
  });
}
