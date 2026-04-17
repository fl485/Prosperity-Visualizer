/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Default to relative asset paths so the built bundle works under any
// GitHub Pages repo path ("/Prosperity-Visualizer/", "/my-fork/", etc.)
// without a rebuild. Override with VITE_BASE=/custom/ for absolute roots.
const base = process.env.VITE_BASE ?? "./";

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
