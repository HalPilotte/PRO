import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    host: "localhost",
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: process.env.TAURI_PLATFORM === "windows" ? "chrome105" : "safari13",
    // Tauri uses WebView2 on Windows; ensure sourcemaps are off in release builds for size.
    sourcemap: process.env.TAURI_DEBUG ? true : false,
  },
});
