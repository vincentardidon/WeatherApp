import { Router } from "express";
import { z } from "zod";
import { config } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const router = Router();

function coordinateSchema(label, min, max) {
  return z.string({ error: `${label} must be provided as a single value.` })
    .trim()
    .min(1, { error: `${label} is required.` })
    .refine((raw) => {
      const value = Number(raw);
      return Number.isFinite(value) && value >= min && value <= max;
    }, { error: `${label} must be a number between ${min} and ${max}.` })
    .transform(Number);
}

const querySchema = z.object({
  lat: coordinateSchema("Latitude", -90, 90),
  lon: coordinateSchema("Longitude", -180, 180),
});

const numberValue = z.number().nullable();
const textValue = z.string().nullable();
const forecastSchema = z.object({
  current: z.object({
    temperature_2m: numberValue,
    apparent_temperature: numberValue,
    relative_humidity_2m: numberValue,
    precipitation: numberValue,
    weather_code: z.number().nullable(),
    wind_speed_10m: numberValue,
  }),
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_max: z.array(numberValue),
    temperature_2m_min: z.array(numberValue),
    weather_code: z.array(z.number().nullable()),
    sunrise: z.array(textValue),
    sunset: z.array(textValue),
  }),
});

router.get("/", async (req, res, next) => {
  const missing = [];
  if (req.query.lat === undefined) missing.push("Latitude is required.");
  if (req.query.lon === undefined) missing.push("Longitude is required.");
  if (missing.length > 0) {
    next(new AppError(400, "invalid_coordinates", missing.join(" ")));
    return;
  }

  const parsedQuery = querySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    const message = parsedQuery.error.issues.map((issue) => issue.message).join(" ");
    next(new AppError(400, "invalid_coordinates", message));
    return;
  }

  const { lat, lon } = parsedQuery.data;
  const url = new URL(config.openMeteoForecastUrl);
  url.search = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
    daily: "temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    timezone: "auto",
    forecast_days: "5",
  }).toString();

  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(config.openMeteoTimeoutMs),
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      next(new AppError(504, "weather_timeout", "The weather provider took too long to respond."));
    } else {
      next(new AppError(503, "weather_unavailable", "The weather provider is currently unavailable."));
    }
    return;
  }

  if (!response.ok) {
    const code = response.status === 429 ? "weather_provider_rate_limited" : "weather_unavailable";
    const message = response.status === 429
      ? "The weather provider is busy. Please try again shortly."
      : "The weather provider could not fulfill the request.";
    next(new AppError(503, code, message));
    return;
  }

  let body;
  try {
    body = await response.json();
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      next(new AppError(504, "weather_timeout", "The weather provider took too long to respond."));
    } else {
      next(new AppError(502, "invalid_weather_response", "The weather provider returned an invalid response."));
    }
    return;
  }

  const forecast = forecastSchema.safeParse(body);
  if (!forecast.success) {
    next(new AppError(502, "invalid_weather_response", "The weather provider returned an invalid response."));
    return;
  }

  const { current, daily } = forecast.data;
  res.status(200).json({
    location: { latitude: lat, longitude: lon },
    current: {
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      weatherCode: current.weather_code,
      windSpeed: current.wind_speed_10m,
    },
    daily: daily.time.map((date, index) => ({
      date,
      high: daily.temperature_2m_max[index] ?? null,
      low: daily.temperature_2m_min[index] ?? null,
      weatherCode: daily.weather_code[index] ?? null,
      sunrise: daily.sunrise[index] ?? null,
      sunset: daily.sunset[index] ?? null,
    })),
  });
});

export default router;
