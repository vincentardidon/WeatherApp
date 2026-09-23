import { config } from "../config/env.js";
import { AppError } from "./AppError.js";

// Builds a URL from a base and a plain object of query parameters.
// The API key (if configured) is added here and is never logged.
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

// GET a URL and return parsed JSON. Every failure becomes an AppError so
// the rest of the backend never has to think about raw network errors.
export async function fetchJson(url, serviceName) {
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
      console.error(`[${serviceName}] timed out after ${config.upstreamTimeoutMs}ms`);
      throw new AppError(504, "upstream_timeout", "The weather service took too long to respond.");
    }
    console.error(`[${serviceName}] network failure: ${error?.cause?.code ?? error?.message}`);
    throw new AppError(503, "upstream_unreachable", "Could not reach the weather service.");
  }

  if (!response.ok) {
    const reason = body && typeof body.reason === "string" ? `: ${body.reason}` : "";
    console.error(`[${serviceName}] HTTP ${response.status}${reason}`);
    if (response.status === 429) {
      throw new AppError(503, "upstream_rate_limited", "The weather service is busy right now.");
    }
    throw new AppError(502, "upstream_error", "The weather service returned an error.");
  }

  if (body === null || typeof body !== "object") {
    console.error(`[${serviceName}] response was not valid JSON`);
    throw new AppError(502, "upstream_invalid_response", "The weather service sent an unreadable response.");
  }

  return body;
}