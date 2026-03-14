import { beforeEach, describe, expect, it, vi } from "vitest";

const sendCheckoutConfirmationEmails = vi.fn();
const listLineItems = vi.fn();
const retrieveSubscription = vi.fn();
const mockAdminFrom = vi.fn();
const webhookEventInsert = vi.fn();
const webhookEventDeleteEq = vi.fn();

const profileUpsert = vi.fn();
const membershipUpsert = vi.fn();
const membershipMaybeSingle = vi.fn();
const workspaceMaybeSingle = vi.fn();
const ownerWorkspaceMaybeSingle = vi.fn();
const workspaceInsertSingle = vi.fn();
const workspaceUpdateEq = vi.fn();
const workspaceUpdate = vi.fn();

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

    profileUpsert.mockResolvedValue({ error: null });
    membershipUpsert.mockResolvedValue({ error: null });
    webhookEventInsert.mockResolvedValue({ error: null });
    webhookEventDeleteEq.mockResolvedValue({ error: null });
    membershipMaybeSingle.mockResolvedValue({
      data: { workspace_id: "11111111-1111-1111-1111-111111111111" },
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
    workspaceUpdateEq.mockResolvedValue({ error: null });
    workspaceUpdate.mockImplementation((payload: unknown) => {
      const currentPayload = payload;
      return {
        eq: (field: string, value: string) => {
          workspaceUpdateEq(field, value, currentPayload);
          if (field === "stripe_customer_id") {
            return {
              select: () => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "11111111-1111-1111-1111-111111111111" },
                  error: null
                })
              })
            };
          }
          return { error: null };
        }
      };
    });

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          upsert: profileUpsert,
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
            eq: (field: string, value: string) => ({
              maybeSingle:
                field === "owner_id"
                  ? ownerWorkspaceMaybeSingle
                  : workspaceMaybeSingle
            })
          }),
          update: workspaceUpdate,
          insert: () => ({
            select: () => ({
              single: workspaceInsertSingle
            })
          })
        };
      }

      if (table === "stripe_webhook_events") {
        return {
          insert: webhookEventInsert,
          delete: () => ({
            eq: webhookEventDeleteEq
          })
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });
  });

  it("uses the central mail service and writes Stripe state to the workspace", async () => {
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
        workspace_id: "11111111-1111-1111-1111-111111111111",
        user_id: "user-1",
        role: "owner"
      }),
      { onConflict: "user_id" }
    );
    expect(workspaceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: "starter",
        stripe_customer_id: "cus_123",
        stripe_subscription_id: "sub_123",
        stripe_price_id: "price_starter",
        subscription_name: "Starter",
        subscription_status: "active"
      })
    );
    expect(sendCheckoutConfirmationEmails).toHaveBeenCalledWith(
      "client@example.com",
      "starter",
      expect.objectContaining({ id: "cs_123" })
    );
    expect(workspaceUpdate).toHaveBeenCalledWith(expect.objectContaining({ due_at: expect.any(String) }));
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
        workspace_id: "22222222-2222-2222-2222-222222222222",
        user_id: "user-1",
        role: "owner"
      }),
      { onConflict: "user_id" }
    );
  });

  it("syncs invoice.paid through the subscription payload", async () => {
    const { handleStripeWebhookEvent } = await import("@/stripe/webhook");

    await handleStripeWebhookEvent({
      id: "evt_paid",
      type: "invoice.paid",
      data: {
        object: {
          id: "in_123",
          customer: "cus_123",
          subscription: "sub_123"
        }
      }
    } as never);

    expect(retrieveSubscription).toHaveBeenCalledWith("sub_123");
    expect(workspaceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: "starter",
        stripe_subscription_id: "sub_123",
        stripe_price_id: "price_starter",
        subscription_status: "active"
      })
    );
  });

  it("marks payment issue on invoice.payment_failed", async () => {
    retrieveSubscription.mockResolvedValueOnce({
      id: "sub_123",
      status: "past_due",
      customer: "cus_123",
      items: {
        data: [{ price: { id: "price_starter", product: "prod_123" } }]
      },
      current_period_end: 1_800_000_000
    });

    const { handleStripeWebhookEvent } = await import("@/stripe/webhook");

    await handleStripeWebhookEvent({
      id: "evt_failed",
      type: "invoice.payment_failed",
      data: {
        object: {
          id: "in_failed",
          customer: "cus_123",
          subscription: "sub_123"
        }
      }
    } as never);

    expect(workspaceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_status: "past_due"
      })
    );
  });

  it("ignores duplicate webhook events already stored in database", async () => {
    webhookEventInsert.mockResolvedValueOnce({
      error: { code: "23505", message: "duplicate key value violates unique constraint" }
    });

    const { handleStripeWebhookEvent } = await import("@/stripe/webhook");

    await handleStripeWebhookEvent({
      id: "evt_duplicate",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          status: "active",
          customer: "cus_123",
          items: { data: [{ price: { id: "price_starter", product: "prod_123" } }] },
          current_period_end: 1_800_000_000
        }
      }
    } as never);

    expect(workspaceUpdate).not.toHaveBeenCalled();
  });
});
