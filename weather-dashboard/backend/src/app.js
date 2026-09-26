import express from "express";
import healthRoutes from "./routes/health.routes.js";
import weatherRoutes from "./routes/weather.routes.js";
import geocodeRoutes from "./routes/geocode.routes.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { requestTimeout } from "./middleware/timeout.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by"); // don't advertise the framework/version

// Keep an unexpected JSON body small; nothing we accept today needs more.
app.use(express.json({ limit: "10kb" }));

app.use(requestTimeout);
app.use(requestLogger);

app.use("/api/health", healthRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/geocode", geocodeRoutes);

// Any other /api route that doesn't exist.
app.use("/api", (req, res) => {
  res.status(404).json({ error: { code: "not_found", message: "Route not found." } });
});

// Must be registered last — Express calls this for errors from any route above.
app.use(errorHandler);

export default app;