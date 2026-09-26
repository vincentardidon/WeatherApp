import "dotenv/config";
import app from "./app.js";
import { config } from "./config/env.js";
import { logger } from "./utils/logger.js";

// A crash here means a bug slipped past every try/catch and error handler in
// the app. Rather than keep running in a possibly-broken state, log it and
// exit — in development `npm run dev` (node --watch) restarts automatically;
// in production, the host/process manager should be configured to do the same.
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception — shutting down", error, { includeStack: true });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logger.error("Unhandled promise rejection — shutting down", error, { includeStack: true });
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`API server running on http://localhost:${PORT}`);
});

// A second, lower-level safety net: if a client's TCP connection just sits
// there without Express ever finishing the request, Node itself cuts it off.
server.requestTimeout = config.requestTimeoutMs + 2000;
