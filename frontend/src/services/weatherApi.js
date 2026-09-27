const WEATHER_ENDPOINT = "/api/weather";

function isFiniteOrNull(value) {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isValidForecast(payload) {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      payload.location &&
      typeof payload.location === "object" &&
      payload.current &&
      typeof payload.current === "object" &&
      isFiniteOrNull(payload.current.temperature) &&
      isFiniteOrNull(payload.current.feelsLike) &&
      isFiniteOrNull(payload.current.humidity) &&
      isFiniteOrNull(payload.current.precipitation) &&
      isFiniteOrNull(payload.current.weatherCode) &&
      isFiniteOrNull(payload.current.windSpeed) &&
      Array.isArray(payload.daily) &&
      payload.daily.every(
        (day) =>
          day &&
          typeof day.date === "string" &&
          isFiniteOrNull(day.high) &&
          isFiniteOrNull(day.low) &&
          isFiniteOrNull(day.weatherCode) &&
          (day.sunrise === null || typeof day.sunrise === "string") &&
          (day.sunset === null || typeof day.sunset === "string"),
      ),
  );
}

export async function getWeather({ latitude, longitude, signal }) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
  });

  let response;
  try {
    response = await fetch(`${WEATHER_ENDPOINT}?${params}`, { signal });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Weather data is unavailable right now. Check your connection and try again.");
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error("The weather service returned an unreadable response. Please try again.");
  }

  if (!response.ok) {
    throw new Error(
      typeof body?.error?.message === "string"
        ? body.error.message
        : "Weather data is unavailable right now. Please try again.",
    );
  }

  if (!isValidForecast(body)) {
    throw new Error("The weather service returned incomplete data. Please try again later.");
  }

  return body;
}
