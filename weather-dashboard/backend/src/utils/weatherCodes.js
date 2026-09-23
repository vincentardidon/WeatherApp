// WMO weather interpretation codes, as documented by Open-Meteo.
// `icon` values are the keys understood by the frontend's WeatherIcon component.
const CODES = {
  0: ["Clear sky", "clear"],
  1: ["Mainly clear", "clear"],
  2: ["Partly cloudy", "partly-cloudy"],
  3: ["Overcast", "cloudy"],
  45: ["Fog", "fog"],
  48: ["Depositing rime fog", "fog"],
  51: ["Light drizzle", "drizzle"],
  53: ["Moderate drizzle", "drizzle"],
  55: ["Dense drizzle", "drizzle"],
  56: ["Light freezing drizzle", "drizzle"],
  57: ["Dense freezing drizzle", "drizzle"],
  61: ["Slight rain", "rain"],
  63: ["Moderate rain", "rain"],
  65: ["Heavy rain", "rain"],
  66: ["Light freezing rain", "rain"],
  67: ["Heavy freezing rain", "rain"],
  71: ["Slight snow fall", "snow"],
  73: ["Moderate snow fall", "snow"],
  75: ["Heavy snow fall", "snow"],
  77: ["Snow grains", "snow"],
  80: ["Slight rain showers", "rain"],
  81: ["Moderate rain showers", "rain"],
  82: ["Violent rain showers", "rain"],
  85: ["Slight snow showers", "snow"],
  86: ["Heavy snow showers", "snow"],
  95: ["Thunderstorm", "thunderstorm"],
  96: ["Thunderstorm with slight hail", "thunderstorm"],
  99: ["Thunderstorm with heavy hail", "thunderstorm"],
};

const NIGHT_ICONS = {
  clear: "clear-night",
  "partly-cloudy": "partly-cloudy-night",
};

export function describeWeatherCode(code, isDay = true) {
  const entry = CODES[code];
  if (!entry) return { condition: "Unknown", icon: null };

  const [condition, dayIcon] = entry;
  const icon = isDay ? dayIcon : NIGHT_ICONS[dayIcon] ?? dayIcon;
  return { condition, icon };
}