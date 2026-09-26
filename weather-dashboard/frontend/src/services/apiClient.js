// Thin wrapper around fetch for talking to OUR backend.
// The browser never calls Open-Meteo (or any weather provider) directly.

// Empty in development: Vite forwards /api/* to the Express server.
// If the API is hosted on another domain, set VITE_API_BASE_URL at build time.
// Anything starting with VITE_ is public, so never put a secret in it.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

// Longer than the backend's own limit (2 upstream calls x 6s), so the backend
// gets the chance to answer with a proper "timeout" error first.
const REQUEST_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor({ code, title, message, retryable }) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.title = title;
    this.retryable = retryable;
  }
}

const SERVICE_UNAVAILABLE = {
  title: "Weather service unavailable",
  message: "We couldn't get weather data right now. Please try again in a moment.",
  retryable: true,
};

// What the user sees for each error code sent by our backend (or raised here).
const ERROR_COPY = {
  invalid_query: {
    title: "Check your search",
    message: "Enter a city or place name.",
    retryable: false,
    useServerMessage: true,
  },
  invalid_coordinates: {
    title: "Invalid location",
    message: "Those coordinates aren't valid.",
    retryable: false,
    useServerMessage: true,
  },
  location_not_found: {
    title: "Location not found",
    message: "We couldn't find that place. Check the spelling or try a nearby city.",
    retryable: false,
  },
  upstream_timeout: {
    title: "The weather service is slow",
    message: "It took too long to respond. Please try again.",
    retryable: true,
  },
  upstream_rate_limited: {
    title: "Too many requests",
    message: "The weather service is busy. Wait a moment and try again.",
    retryable: true,
  },
  upstream_unreachable: SERVICE_UNAVAILABLE,
  upstream_error: SERVICE_UNAVAILABLE,
  upstream_invalid_response: SERVICE_UNAVAILABLE,
  invalid_response: SERVICE_UNAVAILABLE,
  server_unavailable: {
    title: "Can't reach the app server",
    message: "Make sure the backend is running, then try again.",
    retryable: true,
  },
  network_error: {
    title: "Connection problem",
    message: "Check your internet connection and try again.",
    retryable: true,
  },
  offline: {
    title: "You're offline",
    message: "Reconnect to the internet and try again.",
    retryable: true,
  },
  client_timeout: {
    title: "Request timed out",
    message: "The server took too long to respond. Please try again.",
    retryable: true,
  },
  unknown: {
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
    retryable: true,
  },
};

export function createApiError(code, serverMessage) {
  const { useServerMessage, ...copy } = ERROR_COPY[code] ?? ERROR_COPY.unknown;
  const message = useServerMessage && serverMessage ? serverMessage : copy.message;
  return new ApiError({ code, ...copy, message });
}

// GET `path` from our backend and return the parsed JSON body.
// Throws ApiError for every failure, except when `signal` is aborted by the
// caller: that rethrows the original AbortError so the caller can ignore it.
export async function request(path, { signal, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const abortFromCaller = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", abortFromCaller, { once: true });
  }

  try {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        if (timedOut) throw createApiError("client_timeout");
        throw error; // cancelled on purpose by the caller
      }
      const offline = typeof navigator !== "undefined" && navigator.onLine === false;
      throw createApiError(offline ? "offline" : "network_error");
    }

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      // Our backend answers { error: { code, message } }. Anything else (an HTML
      // error page, an empty body) means the server itself isn't answering.
      const code = typeof body?.error?.code === "string" ? body.error.code : "server_unavailable";
      throw createApiError(code, body?.error?.message);
    }

    if (body === null || typeof body !== "object") {
      throw createApiError("invalid_response");
    }
    return body;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}