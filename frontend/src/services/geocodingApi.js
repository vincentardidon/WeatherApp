function validPlace(place) {
  return (
    place &&
    typeof place.name === "string" &&
    place.name.trim().length > 0 &&
    typeof place.country === "string" &&
    Number.isFinite(place.latitude) &&
    place.latitude >= -90 &&
    place.latitude <= 90 &&
    Number.isFinite(place.longitude) &&
    place.longitude >= -180 &&
    place.longitude <= 180
  );
}

export async function searchLocations(query, signal) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({
    name: query,
    count: "6",
    language: "en",
    format: "json",
  }).toString();

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error("City search is unavailable. Please try again.");
  }

  const body = await response.json();
  if (body?.results === undefined) return [];
  if (!Array.isArray(body.results)) {
    throw new Error("City search returned an unreadable response.");
  }

  return body.results.filter(validPlace).map((place) => ({
    id: Number.isFinite(place.id) ? String(place.id) : `${place.latitude},${place.longitude}`,
    name: place.name.trim(),
    region: typeof place.admin1 === "string" && place.admin1 !== place.name ? place.admin1 : null,
    country: place.country,
    countryCode: typeof place.country_code === "string" ? place.country_code : null,
    latitude: place.latitude,
    longitude: place.longitude,
  }));
}

export function formatPlace(place) {
  return [place.name, place.region, place.country]
    .filter((part, index, list) => part && list.indexOf(part) === index)
    .join(", ");
}
