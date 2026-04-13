import { randomUUID } from "node:crypto";
import type { Request, RequestHandler, Response } from "express";
import pino from "pino";
import * as pinoHttpModule from "pino-http";

type LogLevel = "debug" | "info" | "warn" | "error";
type LogMeta = Record<string, unknown>;

const env = process.env.NODE_ENV ?? "development";
const level = (process.env.LOG_LEVEL as LogLevel | undefined) ?? (env === "production" ? "info" : "debug");

const transport =
  env === "production"
    ? undefined
    : pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname"
        }
      });

const baseLogger = pino(
  {
    level,
    base: { env },
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err
    }
  },
  transport
);

function write(levelName: LogLevel, message: string, meta: LogMeta = {}) {
  baseLogger[levelName](meta, message);
}

export const logger = {
  debug: (message: string, meta?: LogMeta) => write("debug", message, meta),
  info: (message: string, meta?: LogMeta) => write("info", message, meta),
  warn: (message: string, meta?: LogMeta) => write("warn", message, meta),
  error: (message: string, meta?: LogMeta) => write("error", message, meta)
};

const pinoHttpFactory =
  (pinoHttpModule as unknown as { default?: (options: unknown) => RequestHandler }).default ??
  (pinoHttpModule as unknown as (options: unknown) => RequestHandler);

export const requestLoggingMiddleware: RequestHandler = pinoHttpFactory({
  logger: baseLogger,
  quietReqLogger: true,
  customAttributeKeys: {
    reqId: "requestId"
  },
  genReqId: (req: Request, res: Response) => {
    const incomingRequestId = req.headers["x-request-id"];
    const requestId =
      typeof incomingRequestId === "string" && incomingRequestId.trim().length > 0
        ? incomingRequestId.trim()
        : randomUUID();
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    return requestId;
  },
  customLogLevel: (_req: Request, res: Response, err?: Error) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    if (env === "production") return "silent";
    return "info";
  },
  autoLogging: {
    ignore: (req: Request) => req.url === "/health" || req.url.startsWith("/uploads")
  },
  customSuccessMessage: () => "http_request",
  customErrorMessage: () => "http_request_error"
});
