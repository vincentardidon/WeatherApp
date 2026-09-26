import { AppError } from "./AppError.js";

const MIN_NAME_LENGTH = 2; // Open-Meteo returns nothing for 1 character anyway
const MAX_INPUT_LENGTH = 100;

// Control characters (things like NUL, ESC) are never legitimate in a place
// name; strip them before anything else.
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

// Letters (any language), numbers, spaces, and a short list of punctuation
// that appears in real place names ("Saint-Étienne", "Coeur d'Alene",
// "Washington, D.C."). Everything else (<, >, /, \, ;, {, }, etc.) is
// stripped rather than rejected outright, since a stray character shouldn't
// block an otherwise valid search.
const DISALLOWED_CHARS = /[^\p{L}\p{N}\s',.-]/gu;

// Cleans free-text search input into a safe string, or throws a 400 AppError
// when nothing usable is left. Used for /api/geocode?q=.
export function sanitizeSearchText(raw) {
  if (typeof raw !== "string") {
    throw new AppError(400, "invalid_query", "The search text must be a single value.");
  }

  if (raw.length > MAX_INPUT_LENGTH) {
    throw new AppError(400, "invalid_query", "That search is too long.");
  }

  const cleaned = raw
    .replace(CONTROL_CHARS, "")
    .replace(DISALLOWED_CHARS, "")
    .trim()
    .replace(/\s+/g, " "); // collapse repeated spaces left behind by stripping

  // "Paris, France" is allowed: only the part before the first comma has to
  // meet the minimum length. The qualifier after the comma can be short (US, UK).
  const namePart = cleaned.split(",")[0].trim();

  if (namePart.length < MIN_NAME_LENGTH) {
    throw new AppError(400, "invalid_query", "Enter at least 2 letters of a location name.");
  }

  return cleaned;
}