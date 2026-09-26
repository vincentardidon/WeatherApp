import { createApiError, request } from "./apiClient.js";

// The UI reads these sections directly, so refuse data that doesn't have them
// instead of crashing while rendering.
function assertWeatherShape(data) {
  const isValid =
    data &&
    data.location &&
    data.current &&
    Array.isArray(data.hourly) &&
    Array.isArray(data.daily) &&
    data.astronomy &&
    data.additional &&
    data.meta;

  if (!isValid) throw createApiError("invalid_response");
  return data;
}

// Weather for exact coordinates. Used directly for "current location", and
// after a geocode lookup for a text search (see searchWeather below).
export async function fetchWeatherByCoordinates(latitude, longitude, { signal } = {}) {
  const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude) });
  return assertWeatherShape(await request(`/api/weather?${params}`, { signal }));
}