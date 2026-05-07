import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { logger } from "./logger.js";
import { HttpError, isHttpError } from "./httpErrors.js";

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  void next;
  const requestId = req.requestId;
  let status = 500;
  let publicMessage = "Internal server error";

  if (isHttpError(err)) {
    status = err.status;
    publicMessage = err.publicMessage;
  } else if (err && typeof err === "object" && "status" in err && typeof (err as { status: unknown }).status === "number") {
    status = (err as { status: number }).status;
  }

  const logMeta: Record<string, unknown> = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    status,
    error: err
  };
  if (status >= 500) {
    logger.error("request_error", logMeta);
  } else {
    logger.warn("request_error", logMeta);
  }

  if (res.headersSent) {
    return;
  }

  res.status(status).json({ error: publicMessage, requestId });
};

export function asyncHandler<T extends Request = Request>(
  handler: (req: T, res: Response, next: NextFunction) => Promise<unknown> | unknown
) {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export { HttpError };
