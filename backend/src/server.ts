import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { logger, requestLoggingMiddleware } from "./utils/logger.js";

import newsRoutes from "./routes/newsRoutes.js";
import eventsRoutes from "./routes/eventsRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLoggingMiddleware);

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
app.use("/api/admin", adminRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/uploads", express.static("uploads"));

app.listen(PORT, () => {
  logger.info("server_started", { port: PORT });
});

process.on("unhandledRejection", (reason) => {
  logger.error("unhandled_rejection", { reason });
});

process.on("uncaughtException", (err) => {
  logger.error("uncaught_exception", { error: err });
});
