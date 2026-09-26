import { AppError } from "./AppError.js";
import { sanitizeSearchText } from "./sanitize.js";

// A query parameter that appears more than once (?lat=1&lat=2) arrives as an
// array, not a string. Every parser below rejects that up front so nothing
// downstream ever has to guard against the "wrong type" case.
function requireString(value, label) {
  if (Array.isArray(value)) {
    throw new AppError(400, "invalid_query", `Provide only one ${label}.`);
  }
  return value;
}

function parseCoordinate(raw, label, min, max) {
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new AppError(400, "invalid_coordinates", `${label} is required.`);
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new AppError(400, "invalid_coordinates", `${label} must be a number between ${min} and ${max}.`);
  }
  return value;
}

// GET /api/geocode?q=<text>
export function parseGeocodeQuery(query) {
  const q = requireString(query?.q, "search term");
  if (q === undefined) {
    throw new AppError(400, "invalid_query", "Provide a location name with ?q=");
  }
  return { query: sanitizeSearchText(q) };
}

// GET /api/weather?lat=<number>&lon=<number>
// Both parameters are required — this route never talks to the geocoding
// service. Turning a place name into coordinates is /api/geocode's job.
export function parseWeatherQuery(query) {
  requireString(query?.lat, "lat");
  requireString(query?.lon, "lon");
  return {
    latitude: parseCoordinate(query?.lat, "lat", -90, 90),
    longitude: parseCoordinate(query?.lon, "lon", -180, 180),
  };
}