import "dotenv/config";
import app from "./app.js";
import { config } from "./config/env.js";

const server = app.listen(config.port, () => {
  console.log("API server is listening", { port: config.port, environment: config.nodeEnv });
});

server.requestTimeout = 30_000;
server.headersTimeout = 35_000;
server.keepAliveTimeout = 5_000;
