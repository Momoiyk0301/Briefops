import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();

vi.mock("@/supabase/server", () => ({
  requireUser
}));

describe("frontend /api/products", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns active products sorted", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        { id: "p1", name: "Starter", sort_order: 1 },
        { id: "p2", name: "Plus", sort_order: 2 }
      ],
      error: null
    });

    const client = {
      from: () => ({
        select: () => ({
          eq: () => ({
            order
          })
        })
      })
    };
    requireUser.mockResolvedValue({ client, userId: "u1" });

    const mod = await import("../../app/api/products/route");
    const response = await mod.GET(new Request("http://localhost/api/products", { headers: { authorization: "Bearer token" } }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(2);
  });
});
