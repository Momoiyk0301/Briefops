import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry"
  },
  webServer: {
    command: "NEXT_PUBLIC_E2E_MOCK_AUTH=true npm run dev -- -p 3000",
    port: 3000,
    reuseExistingServer: true,
    timeout: 120_000
  }
});
