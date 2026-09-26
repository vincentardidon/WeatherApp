import { Router } from "express";
import { handleGetWeather } from "../controllers/weather.controller.js";

const router = Router();

router.get("/", handleGetWeather);

export default router;