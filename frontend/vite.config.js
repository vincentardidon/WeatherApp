import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In development, forward /api requests to the Express backend.
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});