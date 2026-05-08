import express, { type Express, type RequestHandler } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { requestLoggingMiddleware } from "../utils/logger.js";
import { errorHandler } from "../utils/errorHandler.js";
import { adminLimiter, globalLimiter } from "../utils/rateLimit.js";
import { doubleCsrfProtection } from "../utils/csrf.js";

import newsRoutes from "../routes/newsRoutes.js";
import eventsRoutes from "../routes/eventsRoutes.js";
import uploadRoutes from "../routes/uploadRoutes.js";
import adminRoutes from "../routes/adminRoutes.js";
import equipmentRoutes from "../routes/equipmentRoutes.js";
import reservationRoutes from "../routes/reservationRoutes.js";

export interface BuildAppOptions {
  /**
   * Origins to permit via CORS. When omitted, the value is derived from
   * `process.env.CORS_ORIGINS` (comma separated). In non-production
   * environments, `http://localhost:3000` is always added for local dev.
   */
  corsOrigins?: string[];
  /**
   * Skip request logging. Useful for keeping test output clean.
   */
  disableRequestLogging?: boolean;
  /**
   * Skip global and admin-mutation rate limiting. Tests that do not
   * specifically target rate limiting should set this to avoid burning
   * shared limiter buckets.
   */
  disableRateLimiting?: boolean;
  /**
   * Skip CSRF double-submit verification on mutating routes. Tests that
   * exercise resource flows without targeting CSRF can opt in.
   */
  disableCsrf?: boolean;
}

function resolveAllowedOrigins(explicit?: string[]): string[] {
  if (explicit && explicit.length > 0) {
    return explicit;
  }
  const envOrigins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV !== "production") {
    envOrigins.push("http://localhost:3000");
  }
  return envOrigins;
}

export function buildApp(options: BuildAppOptions = {}): Express {
  const app = express();
  app.set("trust proxy", 1);

  const allowedOrigins = resolveAllowedOrigins(options.corsOrigins);

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) {
          cb(null, true);
          return;
        }
        if (allowedOrigins.includes(origin)) {
          cb(null, true);
          return;
        }
        cb(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "X-CSRF-Token"]
    })
  );

  app.use(express.json());
  app.use(cookieParser(process.env.COOKIE_SECRET));

  if (!options.disableRequestLogging) {
    app.use(requestLoggingMiddleware);
  }

  if (!options.disableRateLimiting) {
    app.use(globalLimiter);
  }

  if (!options.disableCsrf) {
    app.use((req, res, next) => {
      const skipCsrf = req.path === "/api/admin/login" || req.path === "/api/admin/csrf";
      if (skipCsrf) {
        next();
        return;
      }
      doubleCsrfProtection(req, res, next);
    });
  }

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/news", newsRoutes);
  app.use("/api/events", eventsRoutes);
  app.use("/api/upload", uploadRoutes);

  const adminMutationLimiter: RequestHandler = (req, res, next) => {
    const isMutation = !["GET", "HEAD", "OPTIONS"].includes(req.method);
    const isLoginEndpoint = req.method === "POST" && req.path === "/login";
    if (!isMutation || isLoginEndpoint) {
      next();
      return;
    }
    adminLimiter(req, res, next);
  };

  if (options.disableRateLimiting) {
    app.use("/api/admin", adminRoutes);
  } else {
    app.use("/api/admin", adminMutationLimiter, adminRoutes);
  }

  app.use("/api/equipment", equipmentRoutes);
  app.use("/api/reservations", reservationRoutes);
  app.use("/uploads", express.static("uploads"));

  app.use(errorHandler);

  return app;
}

export const TEST_ADMIN_PASSWORD = "testpassword";
