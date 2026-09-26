// Formatting helpers. The backend will send METRIC values (°C, km/h, hPa, km, mm).
// These functions convert to the user's chosen units and show "--" when a
// value is missing, so the UI never displays fake numbers.

export const NO_VALUE = "--";

export const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

const isImperial = (units) => units === "imperial";

export function formatTemp(celsius, units) {
  if (!isNumber(celsius)) return NO_VALUE;
  const value = isImperial(units) ? (celsius * 9) / 5 + 32 : celsius;
  return `${Math.round(value)}°`;
}

export function formatPercent(value) {
  return isNumber(value) ? `${Math.round(value)}%` : NO_VALUE;
}

export function formatWindSpeed(kmh, units) {
  if (!isNumber(kmh)) return NO_VALUE;
  return isImperial(units) ? `${Math.round(kmh * 0.621371)} mph` : `${Math.round(kmh)} km/h`;
}

export function formatPressure(hpa, units) {
  if (!isNumber(hpa)) return NO_VALUE;
  return isImperial(units) ? `${(hpa * 0.02953).toFixed(2)} inHg` : `${Math.round(hpa)} hPa`;
}

export function formatDistance(km, units) {
  if (!isNumber(km)) return NO_VALUE;
  return isImperial(units) ? `${(km * 0.621371).toFixed(1)} mi` : `${km.toFixed(1)} km`;
}

export function formatPrecipitation(mm, units) {
  if (!isNumber(mm)) return NO_VALUE;
  return isImperial(units) ? `${(mm / 25.4).toFixed(2)} in` : `${mm.toFixed(1)} mm`;
}

export function formatUv(uv) {
  return isNumber(uv) ? String(Math.round(uv)) : NO_VALUE;
}

export function describeUv(uv) {
  if (!isNumber(uv)) return "";
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very high";
  return "Extreme";
}

const COMPASS_POINTS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

export function degreesToCompass(degrees) {
  if (!isNumber(degrees)) return NO_VALUE;
  const normalized = ((degrees % 360) + 360) % 360;
  return COMPASS_POINTS[Math.round(normalized / 22.5) % 16];
}

// ---------- Dates and times ----------

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// value: ISO string. timeZone: IANA name such as "Asia/Manila" (optional).
export function formatTime(value, timeZone) {
  const date = toDate(value);
  if (!date) return NO_VALUE;
  try {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timeZone || undefined,
    });
  } catch {
    return NO_VALUE;
  }
}

export function formatHourLabel(value, timeZone, index) {
  const date = toDate(value);
  if (!date) return NO_VALUE;
  if (index === 0) return "Now";
  try {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      timeZone: timeZone || undefined,
    });
  } catch {
    return NO_VALUE;
  }
}

// dateString must be a plain "YYYY-MM-DD" (the location's local date).
export function formatDayLabel(dateString, index) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  const date = toDate(dateString);
  if (!date) return NO_VALUE;
  return date.toLocaleDateString([], { weekday: "short", timeZone: "UTC" });
}

export function formatDaylight(sunrise, sunset) {
  const rise = toDate(sunrise);
  const set = toDate(sunset);
  if (!rise || !set || set <= rise) return NO_VALUE;
  const minutes = Math.round((set - rise) / 60000);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

// Returns { progress: 0..1, isDaytime } or null when sunrise/sunset are unknown.
export function getSunProgress(sunrise, sunset, now = new Date()) {
  const rise = toDate(sunrise);
  const set = toDate(sunset);
  if (!rise || !set || set <= rise) return null;
  const raw = (now - rise) / (set - rise);
  return {
    progress: Math.min(Math.max(raw, 0), 1),
    isDaytime: raw >= 0 && raw <= 1,
  };
}

// "10.32°N, 123.89°E". Shows "--" when either coordinate is missing.
export function formatCoordinates(latitude, longitude) {
  if (!isNumber(latitude) || !isNumber(longitude)) return NO_VALUE;
  const lat = `${Math.abs(latitude).toFixed(2)}°${latitude >= 0 ? "N" : "S"}`;
  const lon = `${Math.abs(longitude).toFixed(2)}°${longitude >= 0 ? "E" : "W"}`;
  return `${lat}, ${lon}`;
}