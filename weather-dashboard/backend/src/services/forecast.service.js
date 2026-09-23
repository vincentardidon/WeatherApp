import { config } from "../config/env.js";
import { buildUrl, fetchJson } from "../utils/httpClient.js";

const CURRENT_VARIABLES = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "is_day",
  "precipitation",
  "weather_code",
  "cloud_cover",
  "pressure_msl",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
];

const HOURLY_VARIABLES = [
  "temperature_2m",
  "precipitation_probability",
  "weather_code",
  "is_day",
  "visibility",
  "uv_index",
  "dew_point_2m",
];

const DAILY_VARIABLES = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "sunrise",
  "sunset",
  "precipitation_probability_max",
];

// Gets current, hourly and daily weather for a coordinate from Open-Meteo.
export async function fetchForecast(latitude, longitude) {
  const url = buildUrl(config.openMeteo.forecastUrl, {
    latitude,
    longitude,
    current: CURRENT_VARIABLES.join(","),
    hourly: HOURLY_VARIABLES.join(","),
    daily: DAILY_VARIABLES.join(","),
    timezone: "auto", // times relate to the location, not the server
    forecast_days: 7,
    timeformat: "unixtime", // exact moments in time (no daylight-saving guesswork)
    // Units are set explicitly so a change of API defaults can't break the UI.
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
  });

  return fetchJson(url, "forecast");
}