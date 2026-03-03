import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default {
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"]
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  }
};
