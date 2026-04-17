/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Hosted under https://<user>.github.io/prosperity-visualizer/
// override via VITE_BASE for custom deploys
const base = process.env.VITE_BASE ?? "/prosperity-visualizer/";

export default defineConfig({
  base,
  plugins: [react()],
  worker: {
    format: "es",
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
