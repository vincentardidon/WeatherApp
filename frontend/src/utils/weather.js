export function describeWeather(code) {
  if (code === null || code === undefined) return "Condition unavailable";
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
  if ([71, 73, 75, 77].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Rain showers";
  if ([85, 86].includes(code)) return "Snow showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorms";
  return "Condition unavailable";
}

export function getWeatherIconName(code) {
  if (code === 0) return "sun";
  if (code === 1 || code === 2) return "partly-cloudy";
  if (code === 3) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "storm";
  return "cloud";
}

export function formatTemperature(value, unit) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const converted = unit === "F" ? (value * 9) / 5 + 32 : value;
  return `${Math.round(converted)}°`;
}

export function formatDate(dateString, options = {}) {
  if (typeof dateString !== "string") return "—";
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return "—";
  const date = new Date(year, month - 1, day, 12);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

export function formatTime(timeString) {
  if (typeof timeString !== "string") return "—";
  const time = timeString.split("T")[1];
  if (!time || !/^\d{2}:\d{2}/.test(time)) return "—";
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}

export function formatMeasurement(value, unit) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${Math.round(value)} ${unit}`;
}
