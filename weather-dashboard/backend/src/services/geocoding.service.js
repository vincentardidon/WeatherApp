import { config } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { buildUrl, fetchJson } from "../utils/httpClient.js";

const isCoordinate = (value) => typeof value === "number" && Number.isFinite(value);

// Turns a place name into coordinates using the Open-Meteo Geocoding API.
// The name may include a qualifier after a comma ("Paris, France", "Paris, Texas").
export async function findPlace(name) {
  const url = buildUrl(config.openMeteo.geocodingUrl, {
    name,
    count: 1,
    language: "en",
    format: "json",
  });

  const body = await fetchJson(url, "geocoding");

  // Open-Meteo omits the "results" key entirely when nothing matches.
  const match = Array.isArray(body.results) ? body.results[0] : undefined;

  if (!match || !isCoordinate(match.latitude) || !isCoordinate(match.longitude)) {
    throw new AppError(
      404,
      "location_not_found",
      "No matching location was found. Check the spelling or try a nearby city."
    );
  }

  return {
    name: match.name,
    // Avoid showing "Berlin, Berlin" when the region repeats the city name.
    region: match.admin1 && match.admin1 !== match.name ? match.admin1 : null,
    country: match.country ?? null,
    latitude: match.latitude,
    longitude: match.longitude,
  };
}