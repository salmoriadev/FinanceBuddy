/**
 * This file defines Vite build and development settings for the web app.
 * Its role is to optimize bundling, module resolution, and local development behavior.
 */
import fs from "fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const envFallbackPath = path.resolve(__dirname, "env.txt");

const loadEnvFallback = () => {
  if (!fs.existsSync(envFallbackPath)) return;
  const contents = fs.readFileSync(envFallbackPath, "utf-8");
  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) return;
    const key = match[1];
    if (!key.startsWith("VITE_")) return;
    if (process.env[key]) return;
    let value = match[2] ?? "";
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  });
};

loadEnvFallback();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean,
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("recharts")) return "vendor-charts";
          if (
            id.includes("@radix-ui") ||
            id.includes("embla-carousel-react") ||
            id.includes("vaul")
          ) {
            return "vendor-ui";
          }
          if (
            id.includes("react-router-dom") ||
            id.includes("@tanstack/react-query")
          ) {
            return "vendor-routing-data";
          }
          if (id.includes("react") || id.includes("react-dom")) {
            return "vendor-react";
          }
          return;
        },
      },
    },
  },
}));
