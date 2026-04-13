import type { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      admin?: string | JwtPayload;
      requestId?: string;
    }
  }
}

export {};
