import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry"
  },
  webServer: {
    command:
      "NEXT_PUBLIC_E2E_MOCK_AUTH=true NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWYiOiJleGFtcGxlIiwicm9sZSI6ImFub24ifQ.signature SUPABASE_SERVICE_ROLE_KEY=e2e-service-role npm --workspace @briefops/app run dev -- -p 3100",
    port: 3100,
    reuseExistingServer: false,
    timeout: 120_000
  }
});
