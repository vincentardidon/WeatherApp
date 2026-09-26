import { parseGeocodeQuery } from "../utils/validators.js";
import { searchLocations } from "../services/geocoding.service.js";

// GET /api/geocode?q=<text>
// Always answers 200 with a "results" array — an empty array is a normal,
// successful search that just found nothing, not a server error.
export async function handleGeocode(req, res, next) {
  try {
    const { query } = parseGeocodeQuery(req.query);
    const results = await searchLocations(query);
    res.status(200).json({ results });
  } catch (error) {
    next(error);
  }
}