import express from "express";
import healthRoutes from "./routes/health.routes.js";

const app = express();

app.use(express.json());

app.use("/api/health", healthRoutes);

// Any other /api route that doesn't exist
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;