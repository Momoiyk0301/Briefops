import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry"
  },
  webServer: [
    {
      command: "npm --prefix backend run dev",
      port: 3000,
      reuseExistingServer: true,
      timeout: 120_000
    },
    {
      command: "bash -lc 'cd frontend && VITE_E2E_MOCK_AUTH=true npm run dev -- --host 127.0.0.1 --port 5173'",
      port: 5173,
      reuseExistingServer: true,
      timeout: 120_000
    }
  ]
});
