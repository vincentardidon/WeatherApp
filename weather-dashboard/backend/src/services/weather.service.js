import { findPlace } from "./geocoding.service.js";
import { fetchForecast } from "./forecast.service.js";
import { buildWeatherResponse } from "./weather.mapper.js";

const round4 = (value) => Math.round(value * 10000) / 10000;

// request is the object returned by parseWeatherRequest().
export async function getWeather(request) {
  if (request.type === "search") {
    // Step 1 (geocoding): place name -> coordinates
    const place = await findPlace(request.query);
    // Step 2 (forecast): coordinates -> weather
    const forecast = await fetchForecast(place.latitude, place.longitude);
    return buildWeatherResponse(place, forecast);
  }

  // Coordinates from the browser's location button. Open-Meteo has no
  // reverse geocoding, so we can't turn them into a place name.
  const place = {
    name: "Current location",
    region: null,
    country: null,
    latitude: round4(request.latitude),
    longitude: round4(request.longitude),
  };
  const forecast = await fetchForecast(place.latitude, place.longitude);
  return buildWeatherResponse(place, forecast);
}