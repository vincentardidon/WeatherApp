import { Router } from "express";
import { handleGeocode } from "../controllers/geocode.controller.js";

const router = Router();

router.get("/", handleGeocode);

export default router;