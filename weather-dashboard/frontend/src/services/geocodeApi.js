import { createApiError, request } from "./apiClient.js";

// Search by place name, for example "Cebu" or "Paris, France".
// Always resolves to an array (possibly empty) — an empty array means the
// search was valid but matched nothing, which the caller decides how to show.
export async function searchLocations(query, { signal } = {}) {
  const params = new URLSearchParams({ q: query });
  const data = await request(`/api/geocode?${params}`, { signal });

  if (!Array.isArray(data.results)) {
    throw createApiError("invalid_response");
  }
  return data.results
    .filter((place) =>
      place && typeof place.name === "string" && place.name.trim() &&
      typeof place.latitude === "number" && Number.isFinite(place.latitude) &&
      place.latitude >= -90 && place.latitude <= 90 &&
      typeof place.longitude === "number" && Number.isFinite(place.longitude) &&
      place.longitude >= -180 && place.longitude <= 180
    )
    .map((place) => ({
      name: place.name.trim().slice(0, 100),
      region: typeof place.region === "string" && place.region.trim() ? place.region.trim().slice(0, 100) : null,
      country: typeof place.country === "string" && place.country.trim() ? place.country.trim().slice(0, 100) : null,
      latitude: place.latitude,
      longitude: place.longitude,
    }));
}
