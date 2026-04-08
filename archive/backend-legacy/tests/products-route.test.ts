import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();

vi.mock("@/supabase/server", () => ({
  requireUser
}));

describe("/api/products", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lists active products and normalizes features", async () => {
    const order = vi.fn().mockResolvedValueOnce({
      data: [
        {
          id: "p1",
          name: "Starter",
          slug: "starter",
          description: "desc",
          stripe_price_id: "price_1",
          price_amount: 1900,
          price_currency: "eur",
          billing_interval: "month",
          features: ["a", 2],
          is_highlighted: false,
          sort_order: 1
        }
      ],
      error: null
    });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    requireUser.mockResolvedValueOnce({ client: { from }, userId: "u1" });

    const mod = await import("../app/api/products/route");
    const response = await mod.GET(new Request("http://localhost/api/products", { headers: { authorization: "Bearer token" } }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data[0].features).toEqual(["a", "2"]);
  });
});
