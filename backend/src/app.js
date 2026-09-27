import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import { apiRateLimit } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
app.disable("x-powered-by");
app.use(helmet({ strictTransportSecurity: config.isProduction ? undefined : false }));

const allowedOrigin = config.isProduction
  ? config.frontendUrl.replace(/\/$/, "")
  : "http://localhost:5173";
app.use(cors({
  origin: allowedOrigin,
  methods: ["GET", "HEAD"],
  allowedHeaders: ["Content-Type"],
  maxAge: 600,
}));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb", parameterLimit: 20 }));
app.use("/api", apiRateLimit);
app.use("/api/health", healthRoutes);

app.use((req, res) => {
  res.status(404).json({ error: { code: "not_found", message: "Route not found." } });
});

app.use(errorHandler);

export default app;
