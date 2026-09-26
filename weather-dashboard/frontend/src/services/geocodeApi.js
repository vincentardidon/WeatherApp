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
  return data.results;
}