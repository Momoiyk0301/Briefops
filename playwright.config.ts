import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry"
  },
  webServer: {
    command: "NEXT_PUBLIC_E2E_MOCK_AUTH=true npm --prefix frontend run dev -- -p 5173",
    port: 5173,
    reuseExistingServer: true,
    timeout: 120_000
  }
});
