// A tiny, dependency-free logger. Centralizing this (instead of calling
// console.* all over the codebase) makes it easy to see everywhere that logs,
// and to double check none of it ever includes secrets (API keys, .env values).
function line(level, message, meta) {
  const timestamp = new Date().toISOString();
  const suffix = meta ? ` ${JSON.stringify(meta)}` : "";
  return `${timestamp} [${level}] ${message}${suffix}`;
}

export const logger = {
  info(message, meta) {
    console.log(line("INFO", message, meta));
  },
  warn(message, meta) {
    console.warn(line("WARN", message, meta));
  },
  // `error` should be a caught error/exception. Only its message and name are
  // logged by default; pass includeStack:true for our own unexpected-bug path
  // where a stack trace is genuinely useful for debugging (server console only
  // — this never reaches the HTTP response).
  error(message, error, { includeStack = false } = {}) {
    const meta = { error: error?.message ?? String(error) };
    if (includeStack && error?.stack) meta.stack = error.stack;
    console.error(line("ERROR", message, meta));
  },
};