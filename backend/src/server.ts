import dotenv from "dotenv";
import mongoose from "mongoose";
import { logger } from "./utils/logger.js";
import { buildApp } from "./testing/buildApp.js";

dotenv.config();

const app = buildApp();

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

app.listen(PORT, () => {
  logger.info("server_started", { port: PORT });
});

process.on("unhandledRejection", (reason) => {
  logger.error("unhandled_rejection", { reason });
});

process.on("uncaughtException", (err) => {
  logger.error("uncaught_exception", { error: err });
});
