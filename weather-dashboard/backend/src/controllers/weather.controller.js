import { parseWeatherQuery } from "../utils/validators.js";
import { getWeather } from "../services/weather.service.js";

// GET /api/weather?lat=<number>&lon=<number>
export async function handleGetWeather(req, res, next) {
  try {
    const coordinates = parseWeatherQuery(req.query);
    const weather = await getWeather(coordinates);
    res.status(200).json(weather);
  } catch (error) {
    next(error); // handled by middleware/errorHandler.js
  }
}