import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    tailwindcss(),
    react(),
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(dirname, "./src"),
      react: path.resolve(dirname, "./node_modules/react"),
      "react-dom": path.resolve(dirname, "./node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(
        dirname,
        "./node_modules/react/jsx-runtime.js",
      ),
      "react/jsx-dev-runtime": path.resolve(
        dirname,
        "./node_modules/react/jsx-dev-runtime.js",
      ),
    },
  },
  server: {
    fs: {
      allow: [dirname, path.resolve(dirname, "../kora-design-system")],
    },
  },
});
