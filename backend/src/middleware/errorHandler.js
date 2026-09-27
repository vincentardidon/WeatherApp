export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
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

  res.status(500).json({ error: { code: "internal_error", message: "Something went wrong on our side." } });
}
