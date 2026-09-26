// Central place for configuration read from environment variables.
// server.js imports "dotenv/config" first, so .env is already loaded here.

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

// Open-Meteo needs NO key for non-commercial use. A key is only used for a
// paid commercial plan, which switches to the "customer-" hostnames.
const apiKey = process.env.OPEN_METEO_API_KEY?.trim() || null;

export const config = {
  // How long we wait for each upstream (Open-Meteo) request before giving up.
  upstreamTimeoutMs: toPositiveInt(process.env.UPSTREAM_TIMEOUT_MS, 6000),
  // How long any single request to OUR server may take before we give up on
  // it and answer with 504, even if the cause isn't an upstream call.
  requestTimeoutMs: toPositiveInt(process.env.REQUEST_TIMEOUT_MS, 10000),

  openMeteo: {
    apiKey,
    geocodingUrl:
      process.env.OPEN_METEO_GEOCODING_URL ||
      (apiKey
        ? "https://customer-geocoding-api.open-meteo.com/v1/search"
        : "https://geocoding-api.open-meteo.com/v1/search"),
    forecastUrl:
      process.env.OPEN_METEO_FORECAST_URL ||
      (apiKey
        ? "https://customer-api.open-meteo.com/v1/forecast"
        : "https://api.open-meteo.com/v1/forecast"),
  },
};