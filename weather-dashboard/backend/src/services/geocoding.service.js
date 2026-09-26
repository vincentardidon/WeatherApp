import { config } from "../config/env.js";
import { buildUrl, fetchJson } from "../utils/httpClient.js";

const isCoordinate = (value) => typeof value === "number" && Number.isFinite(value);
const MAX_RESULTS = 5;

// Turns free-text (already sanitized by utils/sanitize.js) into a short list
// of matching places using the Open-Meteo Geocoding API. Returns [] when
// nothing matches — that is a normal, successful search result, not an error.
export async function searchLocations(name) {
  const url = buildUrl(config.openMeteo.geocodingUrl, {
    name,
    count: MAX_RESULTS,
    language: "en",
    format: "json",
  });

  const body = await fetchJson(url, "geocoding");
  const results = Array.isArray(body.results) ? body.results : [];

  return results
    .filter((entry) => isCoordinate(entry?.latitude) && isCoordinate(entry?.longitude))
    .map((entry) => ({
      name: entry.name,
      // Avoid showing "Berlin, Berlin" when the region repeats the city name.
      region: entry.admin1 && entry.admin1 !== entry.name ? entry.admin1 : null,
      country: entry.country ?? null,
      latitude: entry.latitude,
      longitude: entry.longitude,
    }));
}