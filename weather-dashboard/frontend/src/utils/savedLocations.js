const MAX_RECENTS = 8;
const MAX_FAVORITES = 12;
const KEYS = {
  recent: "weather.recentLocations",
  favorites: "weather.favoriteLocations",
};

function validLocation(value) {
  if (!value || typeof value !== "object") return false;
  return (
    typeof value.name === "string" && value.name.trim().length > 0 &&
    (value.region === null || typeof value.region === "string") &&
    (value.country === null || typeof value.country === "string") &&
    typeof value.latitude === "number" && Number.isFinite(value.latitude) &&
    value.latitude >= -90 && value.latitude <= 90 &&
    typeof value.longitude === "number" && Number.isFinite(value.longitude) &&
    value.longitude >= -180 && value.longitude <= 180
  );
}

export function locationKey(location) {
  return `${location.latitude.toFixed(5)},${location.longitude.toFixed(5)}`;
}

function cleanLocation(value) {
  return {
    name: value.name.trim().slice(0, 100),
    region: typeof value.region === "string" ? value.region.trim().slice(0, 100) : null,
    country: typeof value.country === "string" ? value.country.trim().slice(0, 100) : null,
    latitude: value.latitude,
    longitude: value.longitude,
  };
}

function readList(key, limit) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    const unique = new Map();
    for (const item of parsed) {
      if (validLocation(item)) unique.set(locationKey(item), cleanLocation(item));
      if (unique.size >= limit) break;
    }
    return [...unique.values()];
  } catch {
    return [];
  }
}

function writeList(key, value, limit) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value.slice(0, limit)));
  } catch {
    // The feature remains usable for this visit when browser storage is blocked.
  }
}

export function loadRecentLocations() { return readList(KEYS.recent, MAX_RECENTS); }
export function loadFavoriteLocations() { return readList(KEYS.favorites, MAX_FAVORITES); }
export function saveRecentLocations(value) { writeList(KEYS.recent, value, MAX_RECENTS); }
export function saveFavoriteLocations(value) { writeList(KEYS.favorites, value, MAX_FAVORITES); }

export function normalizeLocation(value) {
  return validLocation(value) ? cleanLocation(value) : null;
}
