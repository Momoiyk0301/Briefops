import { beforeEach, describe, expect, it, vi } from "vitest";

const sendCheckoutConfirmationEmails = vi.fn();
const listLineItems = vi.fn();
const retrieveSubscription = vi.fn();
const mockAdminFrom = vi.fn();

vi.mock("@/lib/mail", () => ({
  sendCheckoutConfirmationEmails
}));

vi.mock("@/supabase/server", () => ({
  createServiceRoleClient: () => ({
    from: mockAdminFrom
  })
}));

vi.mock("@/stripe/stripe", () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        listLineItems
      }
    },
    subscriptions: {
      retrieve: retrieveSubscription
    }
  }),
  getPlanFromStripePriceId: (priceId: string) => (priceId === "price_starter" ? "starter" : null),
  isDev: false
}));

describe("stripe webhook mail integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    listLineItems.mockResolvedValue({
      data: [{ price: { id: "price_starter" } }]
    });

    retrieveSubscription.mockResolvedValue({
      id: "sub_123",
      status: "active",
      customer: "cus_123",
      items: {
        data: [{ price: { id: "price_starter", product: "prod_123" } }]
      },
      current_period_end: 1_800_000_000
    });

    const profilesMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "user-1", email: "client@example.com" },
      error: null
    });
    const membershipsMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "membership-1" },
      error: null
    });

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          update: () => ({
            eq: () => ({
              select: () => ({
                maybeSingle: profilesMaybeSingle
              })
            })
          })
        };
      }

      if (table === "memberships") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: membershipsMaybeSingle
            })
          })
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });
  });

  it("uses the central mail service on checkout completion", async () => {
    const { handleStripeWebhookEvent } = await import("@/stripe/webhook");

    await handleStripeWebhookEvent({
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_123",
          customer_details: { email: "client@example.com" },
          customer: "cus_123",
          subscription: "sub_123",
          metadata: {
            org_name: "Events Ops",
            workspace_id: "11111111-1111-1111-1111-111111111111"
          }
        }
      }
    } as never);

    expect(sendCheckoutConfirmationEmails).toHaveBeenCalledWith(
      "client@example.com",
      "starter",
      expect.objectContaining({ id: "cs_123" })
    );
  });
});
