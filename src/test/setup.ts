import "@testing-library/jest-dom/vitest";

process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWYiOiJleGFtcGxlIiwicm9sZSI6ImFub24ifQ.signature";
process.env.NEXT_PUBLIC_E2E_MOCK_AUTH = process.env.NEXT_PUBLIC_E2E_MOCK_AUTH ?? "false";
import "@/i18n";
