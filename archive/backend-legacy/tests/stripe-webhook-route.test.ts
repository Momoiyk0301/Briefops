import { beforeEach, describe, expect, it, vi } from "vitest";

const constructEvent = vi.fn();
const handleStripeWebhookEvent = vi.fn();

vi.mock("@/stripe/stripe", () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent
    }
  }),
  getStripeWebhookSecret: () => "whsec_test"
}));

vi.mock("@/stripe/webhook", () => ({
  handleStripeWebhookEvent
}));

describe("/api/stripe/webhook", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 400 when signature is missing", async () => {
    const mod = await import("../app/api/stripe/webhook/route");
    const response = await mod.POST(new Request("http://localhost/api/stripe/webhook", { method: "POST", body: "{}" }));

    expect(response.status).toBe(400);
  });

  it("returns 400 on invalid signature", async () => {
    constructEvent.mockImplementationOnce(() => {
      throw new Error("Invalid signature");
    });

    const mod = await import("../app/api/stripe/webhook/route");
    const response = await mod.POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: "{}"
      })
    );

    expect(response.status).toBe(400);
  });

  it("processes valid events", async () => {
    constructEvent.mockReturnValueOnce({ id: "evt_1", type: "checkout.session.completed" });
    const mod = await import("../app/api/stripe/webhook/route");

    const response = await mod.POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: "{}"
      })
    );

    expect(response.status).toBe(200);
    expect(handleStripeWebhookEvent).toHaveBeenCalledTimes(1);
  });
});
