import { beforeEach, describe, expect, it, vi } from "vitest";

const createCheckoutSession = vi.fn();
const createCustomer = vi.fn();

const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockUpdateEq = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/supabase/server", () => ({
  requireAuthContext: async () => ({
    client: { from: mockFrom },
    userId: "user-1",
    email: "user@example.com"
  })
}));

vi.mock("@/stripe/stripe", () => ({
  getStripe: () => ({
    customers: { create: createCustomer },
    checkout: { sessions: { create: createCheckoutSession } }
  }),
  getStripePriceId: () => "price_pro"
}));

vi.mock("@/env", () => ({
  env: { APP_URL: "http://localhost:5173" }
}));

describe("/api/stripe/checkout", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate
    });
    mockSelect.mockReturnValue({
      eq: mockEq
    });
    mockEq.mockReturnValue({
      single: mockSingle
    });
    mockUpdate.mockReturnValue({
      eq: mockUpdateEq
    });
  });

  it("returns checkout url", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "user-1", plan: "free", stripe_customer_id: "cus_1" },
      error: null
    });
    createCheckoutSession.mockResolvedValueOnce({ id: "cs_1", url: "https://checkout.stripe.test/session" });

    const mod = await import("../app/api/stripe/checkout/route");
    const response = await mod.POST(new Request("http://localhost/api/stripe/checkout", { method: "POST" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toContain("https://checkout.stripe.test");
  });

  it("creates a customer when missing", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "user-1", plan: "free", stripe_customer_id: null },
      error: null
    });
    createCustomer.mockResolvedValueOnce({ id: "cus_new" });
    mockUpdateEq.mockResolvedValueOnce({ error: null });
    createCheckoutSession.mockResolvedValueOnce({ id: "cs_2", url: "https://checkout.stripe.test/new" });

    const mod = await import("../app/api/stripe/checkout/route");
    const response = await mod.POST(new Request("http://localhost/api/stripe/checkout", { method: "POST" }));
    expect(response.status).toBe(200);
    expect(createCustomer).toHaveBeenCalledTimes(1);
  });
});
