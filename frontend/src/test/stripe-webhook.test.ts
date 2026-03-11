import { beforeEach, describe, expect, it, vi } from "vitest";

const sendCheckoutConfirmationEmails = vi.fn();
const listLineItems = vi.fn();
const retrieveSubscription = vi.fn();
const mockAdminFrom = vi.fn();

const profileUpsert = vi.fn();
const membershipUpsert = vi.fn();
const membershipMaybeSingle = vi.fn();
const workspaceMaybeSingle = vi.fn();
const ownerWorkspaceMaybeSingle = vi.fn();
const workspaceInsertSingle = vi.fn();

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

describe("stripe webhook integration", () => {
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

    profileUpsert.mockResolvedValue({
      data: { id: "user-1", email: "client@example.com" },
      error: null
    });
    membershipUpsert.mockResolvedValue({ error: null });
    membershipMaybeSingle.mockResolvedValue({
      data: { id: "membership-1", org_id: "11111111-1111-1111-1111-111111111111" },
      error: null
    });
    workspaceMaybeSingle.mockResolvedValue({
      data: { id: "11111111-1111-1111-1111-111111111111" },
      error: null
    });
    ownerWorkspaceMaybeSingle.mockResolvedValue({
      data: null,
      error: null
    });
    workspaceInsertSingle.mockResolvedValue({
      data: { id: "22222222-2222-2222-2222-222222222222" },
      error: null
    });

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          upsert: (...args: unknown[]) => {
            profileUpsert(...args);
            return {
              select: () => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "user-1", email: "client@example.com" },
                  error: null
                })
              })
            };
          },
          update: () => ({
            eq: () => ({
              select: () => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "user-1", email: "client@example.com" },
                  error: null
                })
              })
            })
          }),
          select: () => ({
            eq: () => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "user-1", email: "client@example.com" },
                error: null
              })
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
          }),
          upsert: membershipUpsert
        };
      }

      if (table === "workspaces") {
        return {
          select: () => ({
            eq: (_field: string, value: string) => ({
              maybeSingle: value === "user-1" ? ownerWorkspaceMaybeSingle : workspaceMaybeSingle
            })
          }),
          insert: () => ({
            select: () => ({
              single: workspaceInsertSingle
            })
          })
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });
  });

  it("uses the central mail service and updates existing membership with Stripe data", async () => {
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
            user_id: "user-1",
            workspace_name: "Events Ops",
            workspace_id: "11111111-1111-1111-1111-111111111111"
          }
        }
      }
    } as never);

    expect(profileUpsert).toHaveBeenCalled();
    expect(membershipUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: "11111111-1111-1111-1111-111111111111",
        user_id: "user-1",
        role: "owner",
        plan_name: "Starter",
        stripe_price_id: "price_starter",
        stripe_product_id: "prod_123"
      }),
      { onConflict: "user_id" }
    );
    expect(sendCheckoutConfirmationEmails).toHaveBeenCalledWith(
      "client@example.com",
      "starter",
      expect.objectContaining({ id: "cs_123" })
    );
  });

  it("creates a workspace and membership from webhook fallback when none exist", async () => {
    membershipMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    workspaceMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const { handleStripeWebhookEvent } = await import("@/stripe/webhook");

    await handleStripeWebhookEvent({
      id: "evt_2",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_456",
          customer_details: { email: "client@example.com" },
          customer: "cus_123",
          subscription: "sub_123",
          metadata: {
            user_id: "user-1",
            workspace_name: "Events Ops"
          }
        }
      }
    } as never);

    expect(workspaceInsertSingle).toHaveBeenCalled();
    expect(membershipUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: "22222222-2222-2222-2222-222222222222",
        user_id: "user-1"
      }),
      { onConflict: "user_id" }
    );
  });
});
