import { resolve } from "node:path";

export default {
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"]
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  }
};
