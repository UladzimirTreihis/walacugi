import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export function checkAdminToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Unauthorized - No token provided" });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "JWT secret is not configured" });
    return;
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: "Invalid token" });
      return;
    }

    req.admin = decoded;
    next();
  });
}
