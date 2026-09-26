import { config } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

// A safety net for the WHOLE request, on top of the timeout already applied
// to individual upstream calls in utils/httpClient.js. If anything ever takes
// too long to answer — a bug, a future route that forgets its own timeout —
// this makes sure the client still gets a response instead of hanging forever.
export function requestTimeout(req, res, next) {
  const timer = setTimeout(() => {
    if (res.headersSent) return;
    logger.warn("Request timed out", { method: req.method, path: req.path });
    // Reuses the same error shape as every other failure (see errorHandler.js).
    next(new AppError(504, "request_timeout", "The server took too long to respond."));
  }, config.requestTimeoutMs);

  // Whichever happens first — a normal response or the timeout — clears the timer.
  res.on("finish", () => clearTimeout(timer));
  res.on("close", () => clearTimeout(timer));

  next();
}