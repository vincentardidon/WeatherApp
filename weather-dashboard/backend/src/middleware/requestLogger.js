import { logger } from "../utils/logger.js";

// Logs one line per request: method, path, status code and duration.
// req.originalUrl includes the query string (e.g. "?q=Cebu"), which is safe
// to log — nothing secret ever arrives FROM the client, only our own server
// adds the Open-Meteo API key, and only when calling out (see httpClient.js).
export function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on("finish", () => {
    logger.info(`${req.method} ${req.originalUrl}`, {
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
}