import { AppError } from "../utils/AppError.js";

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  if (error?.type === "entity.too.large" || error?.status === 413) {
    res.status(413).json({ error: { code: "payload_too_large", message: "The request body is too large." } });
    return;
  }

  if (error?.type === "entity.parse.failed") {
    res.status(400).json({ error: { code: "invalid_json", message: "The request body must contain valid JSON." } });
    return;
  }

  if (typeof error?.status === "number" && error.status >= 400 && error.status < 500) {
    res.status(error.status).json({
      error: { code: "bad_request", message: "The request could not be understood." },
    });
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.error("Request failed", { errorName: error?.name ?? "Error" });
  }

  res.status(500).json({ error: { code: "internal_error", message: "Something went wrong on our side." } });
}
