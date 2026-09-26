import { fetchForecast } from "./forecast.service.js";
import { buildWeatherResponse } from "./weather.mapper.js";

// coordinates: { latitude, longitude }, already validated by parseWeatherQuery.
export async function getWeather(coordinates) {
  const forecast = await fetchForecast(coordinates.latitude, coordinates.longitude);
  return buildWeatherResponse(coordinates, forecast);
}