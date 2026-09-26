import { config } from "../config/env.js";
import { AppError } from "./AppError.js";
import { logger } from "./logger.js";

// Builds a URL from a base and a plain object of query parameters.
// The API key (if configured) is added here, server-side only, and is never
// logged or echoed back to the client.
export function buildUrl(baseUrl, params) {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  if (config.openMeteo.apiKey) {
    url.searchParams.set("apikey", config.openMeteo.apiKey);
  }
  return url;
}

// GET a URL and return parsed JSON. Every failure becomes an AppError so the
// rest of the backend never has to think about raw network errors, and a
// slow or hanging upstream can never hang OUR server (AbortSignal.timeout).
export async function fetchJson(url, serviceName) {
  // Never log the full URL: with an API key configured it would be a secret.
  const safeUrl = `${url.origin}${url.pathname}`;

  let response;
  let body = null;

  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(config.upstreamTimeoutMs),
    });
    body = await response.json().catch(() => null);
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      logger.warn(`${serviceName}: upstream timed out`, { url: safeUrl, timeoutMs: config.upstreamTimeoutMs });
      throw new AppError(504, "upstream_timeout", "The weather service took too long to respond.");
    }
    logger.error(`${serviceName}: network failure`, error);
    throw new AppError(503, "upstream_unreachable", "Could not reach the weather service.");
  }

  if (!response.ok) {
    const reason = body && typeof body.reason === "string" ? body.reason : undefined;
    logger.warn(`${serviceName}: upstream returned an error`, { url: safeUrl, status: response.status, reason });
    if (response.status === 429) {
      throw new AppError(503, "upstream_rate_limited", "The weather service is busy right now.");
    }
    throw new AppError(502, "upstream_error", "The weather service returned an error.");
  }

  if (body === null || typeof body !== "object") {
    logger.error(`${serviceName}: response was not valid JSON`, new Error("non-JSON body"));
    throw new AppError(502, "upstream_invalid_response", "The weather service sent an unreadable response.");
  }

  return body;
}