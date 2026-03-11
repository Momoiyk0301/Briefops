import { beforeEach, describe, expect, it, vi } from "vitest";

const createPortalSession = vi.fn();

const mockEq = vi.fn();
const mockSingle = vi.fn();
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
    billingPortal: { sessions: { create: createPortalSession } }
  })
}));

vi.mock("@/env", () => ({
  env: { APP_URL: "http://localhost:3000" }
}));

describe("frontend /api/stripe/portal", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    mockFrom.mockReturnValue({
      select: mockSelect
    });
    mockSelect.mockReturnValue({
      eq: mockEq
    });
    mockEq.mockReturnValue({
      single: mockSingle
    });
  });

  it("returns portal url and uses billing return url", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "user-1", stripe_customer_id: "cus_1" },
      error: null
    });
    createPortalSession.mockResolvedValueOnce({ url: "https://billing.stripe.test/portal" });

    const mod = await import("../../app/api/stripe/portal/route");
    const response = await mod.POST(new Request("http://localhost/api/stripe/portal", { method: "POST" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toContain("https://billing.stripe.test");
    expect(createPortalSession).toHaveBeenCalledWith({
      customer: "cus_1",
      return_url: "http://localhost:3000/account?billing=returned"
    });
  });

  it("returns 409 when stripe customer is missing", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: "user-1", stripe_customer_id: null },
      error: null
    });

    const mod = await import("../../app/api/stripe/portal/route");
    const response = await mod.POST(new Request("http://localhost/api/stripe/portal", { method: "POST" }));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toMatch(/facturation Stripe active/i);
  });
});
