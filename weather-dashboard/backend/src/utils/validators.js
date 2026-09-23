import { AppError } from "./AppError.js";

const MIN_NAME_LENGTH = 2; // Open-Meteo returns nothing for 1 character
const MAX_QUERY_LENGTH = 100;

function parseSearchText(raw) {
  if (typeof raw !== "string") {
    throw new AppError(400, "invalid_query", "The search text must be a single value.");
  }
  // Trim and collapse repeated spaces.
  const text = raw.trim().replace(/\s+/g, " ");
  // "Paris, France" is allowed: the part before the first comma is the place name.
  const name = text.split(",")[0].trim();

  if (name.length < MIN_NAME_LENGTH) {
    throw new AppError(400, "invalid_query", "Enter at least 2 characters for the location name.");
  }
  if (text.length > MAX_QUERY_LENGTH) {
    throw new AppError(400, "invalid_query", "That search is too long.");
  }
  return text;
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

// Reads req.query and returns either
//   { type: "search", query }  or  { type: "coordinates", latitude, longitude }
export function parseWeatherRequest(query) {
  const { q, lat, lon } = query ?? {};
  const hasSearch = q !== undefined;
  const hasCoordinates = lat !== undefined || lon !== undefined;

  if (hasSearch && hasCoordinates) {
    throw new AppError(400, "invalid_query", "Use either q or lat/lon, not both.");
  }
  if (hasSearch) {
    return { type: "search", query: parseSearchText(q) };
  }
  if (hasCoordinates) {
    return {
      type: "coordinates",
      latitude: parseCoordinate(lat, "Latitude", -90, 90),
      longitude: parseCoordinate(lon, "Longitude", -180, 180),
    };
  }
  throw new AppError(400, "invalid_query", "Provide a location name (q) or coordinates (lat and lon).");
}