import { AppError } from "../utils/AppError.js";
import { describeWeatherCode } from "../utils/weatherCodes.js";

const HOURS_TO_SHOW = 24;
const DAYS_TO_SHOW = 7;

// ---------- small helpers ----------

const num = (value) => (typeof value === "number" && Number.isFinite(value) ? value : null);
const at = (list, index) => (Array.isArray(list) ? num(list[index]) : null);
const round4 = (value) => Math.round(value * 10000) / 10000;

// Open-Meteo unix seconds -> ISO string in UTC ("2026-09-21T06:15:00.000Z").
const toIso = (unixSeconds) =>
  num(unixSeconds) === null ? null : new Date(unixSeconds * 1000).toISOString();

// Daily entries are the start of each LOCAL day, so formatting that moment in
// the location's timezone gives the local calendar date, as "YYYY-MM-DD".
function toLocalDate(unixSeconds, timeZone) {
  if (num(unixSeconds) === null || !timeZone) return null;
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(unixSeconds * 1000));
  } catch {
    return null;
  }
}

// Index of the last hourly entry that is not in the future. Works even for
// half-hour timezones (e.g. India, +5:30) where hourly moments aren't on a UTC hour.
function findCurrentHourIndex(hourlyTimes, nowUnix) {
  const next = hourlyTimes.findIndex((time) => time > nowUnix);
  if (next === -1) return hourlyTimes.length - 1;
  return Math.max(next - 1, 0);
}

// ---------- main mapper ----------

// Converts Open-Meteo's forecast response into the exact shape the React UI
// expects (see frontend/src/data/emptyWeather.js). Units: °C, km/h, hPa, km, mm.
// `coordinates` is what the CLIENT asked for (a place name, if any, is added
// by the frontend after a separate /api/geocode call — this route only knows
// about coordinates).
export function buildWeatherResponse(coordinates, forecast) {
  const { current, hourly, daily } = forecast ?? {};

  const isValid =
    current &&
    hourly &&
    daily &&
    Array.isArray(hourly.time) &&
    hourly.time.length > 0 &&
    Array.isArray(daily.time) &&
    daily.time.length > 0;

  if (!isValid) {
    throw new AppError(502, "upstream_invalid_response", "The weather service sent incomplete data.");
  }

  const timezone = typeof forecast.timezone === "string" ? forecast.timezone : null;
  const hourIndex = findCurrentHourIndex(hourly.time, current.time);

  const now = describeWeatherCode(current.weather_code, current.is_day === 1);
  const visibilityMeters = at(hourly.visibility, hourIndex);

  const hourlyItems = hourly.time
    .slice(hourIndex, hourIndex + HOURS_TO_SHOW)
    .map((time, offset) => {
      const index = hourIndex + offset;
      const { icon } = describeWeatherCode(at(hourly.weather_code, index), at(hourly.is_day, index) === 1);
      return {
        time: toIso(time),
        temperature: at(hourly.temperature_2m, index),
        icon,
        precipitationChance: at(hourly.precipitation_probability, index),
      };
    });

  const dailyItems = daily.time.slice(0, DAYS_TO_SHOW).map((time, index) => {
    const { icon } = describeWeatherCode(at(daily.weather_code, index), true);
    return {
      date: toLocalDate(time, timezone),
      high: at(daily.temperature_2m_max, index),
      low: at(daily.temperature_2m_min, index),
      icon,
      precipitationChance: at(daily.precipitation_probability_max, index),
    };
  });

  return {
    location: {
      name: null,
      region: null,
      country: null,
      timezone,
      latitude: round4(coordinates.latitude),
      longitude: round4(coordinates.longitude),
    },
    current: {
      temperature: num(current.temperature_2m),
      feelsLike: num(current.apparent_temperature),
      high: at(daily.temperature_2m_max, 0),
      low: at(daily.temperature_2m_min, 0),
      condition: now.condition,
      icon: now.icon,
      humidity: num(current.relative_humidity_2m),
      windSpeed: num(current.wind_speed_10m),
      windDirection: num(current.wind_direction_10m),
      pressure: num(current.pressure_msl),
      visibility: visibilityMeters === null ? null : visibilityMeters / 1000,
      uvIndex: at(hourly.uv_index, hourIndex),
      observedAt: toIso(current.time),
    },
    hourly: hourlyItems,
    daily: dailyItems,
    astronomy: {
      sunrise: toIso(daily.sunrise?.[0]),
      sunset: toIso(daily.sunset?.[0]),
    },
    additional: {
      dewPoint: at(hourly.dew_point_2m, hourIndex),
      cloudCover: num(current.cloud_cover),
      precipitation: num(current.precipitation),
      windGusts: num(current.wind_gusts_10m),
    },
    meta: { source: "Open-Meteo" },
  };
}