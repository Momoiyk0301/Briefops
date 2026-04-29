import { afterEach, describe, expect, it, vi } from "vitest";

function seedBaseEnv() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  vi.stubEnv("APP_URL", "http://localhost:3000");
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_123");
}

describe("getStripeEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("accepts stripe price ids", async () => {
    seedBaseEnv();
    vi.stubEnv("STRIPE_STARTER_ID", "price_starter");
    vi.stubEnv("STRIPE_PRO_ID", "price_pro");
    vi.stubEnv("STRIPE_PLUS_ID", "price_plus");

    const { getStripeEnv } = await import("@/env");
    expect(getStripeEnv().STRIPE_STARTER_ID).toBe("price_starter");
  });

  it("rejects stripe product ids used as price ids", async () => {
    seedBaseEnv();
    vi.stubEnv("STRIPE_STARTER_ID", "prod_starter");
    vi.stubEnv("STRIPE_PRO_ID", "price_pro");
    vi.stubEnv("STRIPE_PLUS_ID", "price_plus");

    const { getStripeEnv } = await import("@/env");
    expect(() => getStripeEnv()).toThrow(/invalid stripe environment variables/i);
  });
});
