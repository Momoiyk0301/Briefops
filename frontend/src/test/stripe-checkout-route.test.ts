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
  getPlanFromStripePriceId: () => "starter",
  getStripePriceIdForPlan: () => "price_starter"
}));

vi.mock("@/env", () => ({
  env: { APP_URL: "http://localhost:5173" }
}));

describe("frontend /api/stripe/checkout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("maps onboarding checkout with workspace metadata", async () => {
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

    const mod = await import("../../app/api/stripe/checkout/route");
    const response = await mod.POST(
      new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          stripe_price_id: "price_starter",
          workspace_id: "11111111-1111-1111-1111-111111111111",
          source: "onboarding"
        })
      })
    );

    expect(response.status).toBe(200);
    expect(createCheckoutSession).toHaveBeenCalledTimes(1);
    expect(createCheckoutSession.mock.calls[0][0].success_url).toContain("/onboarding?step=demo");
    expect(createCheckoutSession.mock.calls[0][0].cancel_url).toContain("/onboarding?step=products");
    expect(createCheckoutSession.mock.calls[0][0].metadata.workspace_id).toBe("11111111-1111-1111-1111-111111111111");
  });
});
