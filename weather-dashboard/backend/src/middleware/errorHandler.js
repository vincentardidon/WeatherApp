import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

function sendError(res, status, code, message) {
  // Always the same envelope, for every kind of failure, so the frontend can
  // rely on error.error.code / error.error.message no matter what went wrong.
  res.status(status).json({ error: { code, message } });
}

// Express recognises error-handling middleware by its four parameters.
// Registered last in app.js so every route's errors end up here.
// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  // An error we raised on purpose (bad input, upstream failure, ...): we
  // already know the right status, code and a safe message to show.
  if (error instanceof AppError) {
    sendError(res, error.status, error.code, error.message);
    return;
  }

  // Malformed requests rejected by Express/body-parser itself (e.g. bad JSON
  // in a request body) already carry a 4xx status.
  if (typeof error?.status === "number" && error.status >= 400 && error.status < 500) {
    sendError(res, 400, "bad_request", "The request could not be understood.");
    return;
  }

  // Anything else is a bug we didn't anticipate. Log the full error —
  // message AND stack — to the server console for debugging, but the
  // response to the browser NEVER includes the stack trace or error details.
  logger.error("Unhandled error", error, { includeStack: true });
  sendError(res, 500, "internal_error", "Something went wrong on our side.");
}