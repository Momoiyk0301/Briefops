import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default {
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/test/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["archive/**", "e2e/**", "node_modules/**"]
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  }
};
