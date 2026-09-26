// The shape of the weather data the UI expects. Every value is null for now,
// so components render "--" instead of made-up numbers.
//
// Stage 3 will replace this with a real response from our backend.
// Units the backend should send:
//   temperatures: °C   wind speed: km/h   pressure: hPa
//   visibility: km     precipitation: mm  percentages: 0-100
//   times: ISO 8601 strings   daily.date: "YYYY-MM-DD"
//   icon: "clear" | "partly-cloudy" | "cloudy" | "drizzle" | "rain"
//         | "thunderstorm" | "snow" | "fog" | "wind"

const HOURLY_COUNT = 12;
const DAILY_COUNT = 7;

export function createEmptyWeather() {
  return {
        location: {
      name: null,
      region: null,
      country: null,
      timezone: null,
      latitude: null,
      longitude: null,
    },
    current: {
      temperature: null,
      feelsLike: null,
      high: null,
      low: null,
      condition: null,
      icon: null,
      humidity: null,
      windSpeed: null,
      windDirection: null, // degrees the wind comes FROM (0-360)
      pressure: null,
      visibility: null,
      uvIndex: null,
      observedAt: null,
    },
    hourly: Array.from({ length: HOURLY_COUNT }, () => ({
      time: null,
      temperature: null,
      icon: null,
      precipitationChance: null,
    })),
    daily: Array.from({ length: DAILY_COUNT }, () => ({
      date: null,
      high: null,
      low: null,
      icon: null,
      precipitationChance: null,
    })),
    astronomy: { sunrise: null, sunset: null },
    additional: { dewPoint: null, cloudCover: null, precipitation: null, windGusts: null },
    meta: { source: null },
  };
}