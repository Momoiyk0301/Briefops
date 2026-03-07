import { beforeEach, describe, expect, it, vi } from "vitest";

const createCheckoutSession = vi.fn();
const createCustomer = vi.fn();
const mockAdminFrom = vi.fn();

vi.mock("@/supabase/server", () => ({
  requireAuthContext: async () => ({
    userId: "user-1",
    email: "user@example.com"
  }),
  createServiceRoleClient: () => ({
    from: mockAdminFrom
  })
}));

vi.mock("@/stripe/stripe", () => ({
  getStripe: () => ({
    customers: { create: createCustomer },
    checkout: { sessions: { create: createCheckoutSession } }
  }),
  getPlanFromStripePriceId: () => "pro",
  getStripePriceIdForPlan: () => "price_pro"
}));

vi.mock("@/env", () => ({
  env: { APP_URL: "http://localhost:5173" }
}));

describe("/api/stripe/checkout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns checkout url", async () => {
    const profileMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "user-1", plan: "free", stripe_customer_id: "cus_1" },
      error: null
    });
    const membershipMaybeSingle = vi.fn().mockResolvedValue({
      data: { org_id: "ws-1" },
      error: null
    });
    const profilesUpsert = vi.fn().mockResolvedValue({ error: null });

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          upsert: profilesUpsert,
          select: () => ({
            eq: () => ({
              maybeSingle: profileMaybeSingle
            })
          }),
          update: () => ({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        };
      }
      if (table === "memberships") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: membershipMaybeSingle
            })
          })
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    createCheckoutSession.mockResolvedValueOnce({ id: "cs_1", url: "https://checkout.stripe.test/session" });

    const mod = await import("../app/api/stripe/checkout/route");
    const response = await mod.POST(
      new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ plan: "pro" }),
        headers: { "content-type": "application/json" }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toContain("https://checkout.stripe.test");
  });

  it("creates a customer when missing", async () => {
    const profileMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "user-1", plan: "free", stripe_customer_id: null },
      error: null
    });
    const membershipMaybeSingle = vi.fn().mockResolvedValue({
      data: { org_id: "ws-1" },
      error: null
    });
    const profilesUpsert = vi.fn().mockResolvedValue({ error: null });
    const updateEq = vi.fn().mockResolvedValue({ error: null });

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          upsert: profilesUpsert,
          select: () => ({
            eq: () => ({
              maybeSingle: profileMaybeSingle
            })
          }),
          update: () => ({
            eq: updateEq
          })
        };
      }
      if (table === "memberships") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: membershipMaybeSingle
            })
          })
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    createCustomer.mockResolvedValueOnce({ id: "cus_new" });
    createCheckoutSession.mockResolvedValueOnce({ id: "cs_2", url: "https://checkout.stripe.test/new" });

    const mod = await import("../app/api/stripe/checkout/route");
    const response = await mod.POST(
      new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ plan: "starter" }),
        headers: { "content-type": "application/json" }
      })
    );
    expect(response.status).toBe(200);
    expect(createCustomer).toHaveBeenCalledTimes(1);
  });
});
