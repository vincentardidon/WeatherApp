// Orchestrates the two backend calls a text search needs:
//   1. /api/geocode  — turn the typed text into a place (name, region, country, coordinates)
//   2. /api/weather  — turn those coordinates into weather
// The two backend routes stay single-purpose; this is the one place that
// combines them, so App.jsx doesn't need to know the two-step shape.
import { createApiError } from "./apiClient.js";
import { searchLocations } from "./geocodeApi.js";
import { fetchWeatherByCoordinates } from "./weatherApi.js";

export async function searchWeather(query, { signal } = {}) {
  const matches = await searchLocations(query, { signal });
  const place = matches[0];

  if (!place) {
    throw createApiError("location_not_found");
  }

  const weather = await fetchWeatherByCoordinates(place.latitude, place.longitude, { signal });
  return {
    ...weather,
    location: {
      ...weather.location,
      name: place.name,
      region: place.region,
      country: place.country,
    },
  };
}

// Weather for the browser's geolocation result. No place name is available
// (Open-Meteo has no reverse geocoding), so we label it generically.
export async function locateWeather(latitude, longitude, { signal } = {}) {
  const weather = await fetchWeatherByCoordinates(latitude, longitude, { signal });
  return {
    ...weather,
    location: { ...weather.location, name: "Current location", region: null, country: null },
  };
}