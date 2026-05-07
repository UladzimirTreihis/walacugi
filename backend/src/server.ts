import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import { logger, requestLoggingMiddleware } from "./utils/logger.js";
import { errorHandler } from "./utils/errorHandler.js";
import { adminLimiter, globalLimiter } from "./utils/rateLimit.js";
import { doubleCsrfProtection } from "./utils/csrf.js";
import type { RequestHandler } from "express";

import newsRoutes from "./routes/newsRoutes.js";
import eventsRoutes from "./routes/eventsRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:3000");
}

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
app.use(requestLoggingMiddleware);
app.use(globalLimiter);
app.use((req, res, next) => {
  const skipCsrf = req.path === "/api/admin/login" || req.path === "/api/admin/csrf";
  if (skipCsrf) {
    next();
    return;
  }
  doubleCsrfProtection(req, res, next);
});

const PORT = Number(process.env.PORT) || 4000;
const MONGO_USERNAME = process.env.MONGO_INITDB_ROOT_USERNAME;
const MONGO_PASSWORD = process.env.MONGO_INITDB_ROOT_PASSWORD;
const MONGO_DATABASE = process.env.MONGO_DATABASE;
const fallbackUri = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@mongo:27017/${MONGO_DATABASE}?authSource=admin`;
const DB_URI = process.env.MONGO_URL || fallbackUri;

mongoose
  .connect(DB_URI)
  .then(() => logger.info("mongodb_connected"))
  .catch((err: Error) => logger.error("mongodb_connection_error", { error: err }));

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
app.use("/api/admin", adminMutationLimiter, adminRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/uploads", express.static("uploads"));

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info("server_started", { port: PORT });
});

process.on("unhandledRejection", (reason) => {
  logger.error("unhandled_rejection", { reason });
});

process.on("uncaughtException", (err) => {
  logger.error("uncaught_exception", { error: err });
});
