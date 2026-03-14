import Stripe from "stripe";

import { getInitials } from "@/lib/branding";
import { sendCheckoutConfirmationEmails } from "@/lib/mail";
import { createServiceRoleClient } from "@/supabase/server";
import { getPlanFromStripePriceId, getStripe, isDev } from "@/stripe/stripe";

type BillingPlan = "starter" | "pro" | "guest" | "funder" | "enterprise";

type WorkspacePatch = {
  plan?: BillingPlan;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  subscription_name?: string | null;
  subscription_status?: string | null;
  current_period_end?: string | null;
};

function isKnownMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: string }).code ?? "") : "";
  const message = "message" in error ? String((error as { message?: string }).message ?? "") : "";
  return code === "42P01" || /relation .* does not exist/i.test(message);
}

function normalizeWebhookPlan(value: string | null | undefined): BillingPlan {
  const plan = String(value ?? "").trim().toLowerCase();
  if (plan === "pro" || plan === "guest" || plan === "funder" || plan === "enterprise") return plan;
  return "starter";
}

function resolvePlanFromSubscription(subscription: Stripe.Subscription): BillingPlan {
  for (const item of subscription.items.data) {
    const priceId = item.price?.id;
    if (!priceId) continue;
    const plan = getPlanFromStripePriceId(priceId);
    if (plan) return plan;
  }
  return "pro";
}

function toSubscriptionName(plan: BillingPlan) {
  if (plan === "enterprise") return "Enterprise";
  if (plan === "funder") return "Funder";
  if (plan === "guest") return "Guest";
  if (plan === "pro") return "Pro";
  return "Starter";
}

function buildSubscriptionPatch(subscription: Stripe.Subscription): WorkspacePatch {
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const plan = resolvePlanFromSubscription(subscription);
  const periodEndUnix = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;

  return {
    plan,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    subscription_name: toSubscriptionName(plan),
    subscription_status: subscription.status,
    current_period_end: typeof periodEndUnix === "number" ? new Date(periodEndUnix * 1000).toISOString() : null
  };
}

function formatWorkspaceName(email: string | null | undefined) {
  if (!email) return "BriefOPS Workspace";
  const local = email.split("@")[0]?.trim();
  if (!local) return "BriefOPS Workspace";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  return cleaned ? `${cleaned} workspace` : "BriefOPS Workspace";
}

async function updateWorkspaceDueAt(workspaceId: string | null | undefined) {
  if (!workspaceId) return;
  const admin = createServiceRoleClient();
  const dueAt = new Date();
  dueAt.setMonth(dueAt.getMonth() + 1);
  const { error } = await admin.from("workspaces").update({ due_at: dueAt.toISOString() }).eq("id", workspaceId);
  if (error) throw error;
}

async function upsertProfileIdentity(userId: string, email?: string | null) {
  const admin = createServiceRoleClient();
  const normalizedEmail = email?.toLowerCase().trim() || undefined;
  if (!normalizedEmail) return;
  const { error } = await admin.from("profiles").upsert(
    {
      id: userId,
      email: normalizedEmail
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}

async function findUserByEmail(email: string) {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id,email")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function ensureWorkspaceForUser(
  userId: string,
  email?: string | null,
  workspaceName?: string | null,
  preferredWorkspaceId?: string | null
) {
  const admin = createServiceRoleClient();

  const { data: membership, error: membershipError } = await admin
    .from("memberships")
    .select("workspace_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (membershipError) throw membershipError;

  let workspaceId = membership?.workspace_id ?? null;

  if (preferredWorkspaceId) {
    const { data: preferredWorkspace, error: preferredWorkspaceError } = await admin
      .from("workspaces")
      .select("id")
      .eq("id", preferredWorkspaceId)
      .maybeSingle();
    if (preferredWorkspaceError) throw preferredWorkspaceError;
    if (preferredWorkspace?.id) workspaceId = preferredWorkspace.id;
  }

  if (!workspaceId) {
    const { data: ownerWorkspace, error: ownerWorkspaceError } = await admin
      .from("workspaces")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (ownerWorkspaceError) throw ownerWorkspaceError;
    workspaceId = ownerWorkspace?.id ?? null;
  }

  if (!workspaceId) {
    const name = workspaceName?.trim() || formatWorkspaceName(email);
    const { data: createdWorkspace, error: createWorkspaceError } = await admin
      .from("workspaces")
      .insert({
        owner_id: userId,
        name,
        initials: getInitials(name, "WS")
      })
      .select("id")
      .single();
    if (createWorkspaceError) throw createWorkspaceError;
    workspaceId = createdWorkspace.id;
  }

  const { error: membershipUpsertError } = await admin.from("memberships").upsert(
    {
      workspace_id: workspaceId,
      user_id: userId,
      role: "owner"
    },
    { onConflict: "user_id" }
  );
  if (membershipUpsertError) throw membershipUpsertError;

  return workspaceId;
}

async function updateWorkspaceById(workspaceId: string, patch: WorkspacePatch, refreshDueAt = false) {
  const admin = createServiceRoleClient();
  const { error } = await admin.from("workspaces").update(patch).eq("id", workspaceId);
  if (error) throw error;
  if (refreshDueAt) {
    await updateWorkspaceDueAt(workspaceId);
  }
}

async function updateWorkspaceByCustomerId(customerId: string, patch: WorkspacePatch, refreshDueAt = false): Promise<boolean> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("workspaces")
    .update(patch)
    .eq("stripe_customer_id", customerId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data?.id) return false;
  if (refreshDueAt) {
    await updateWorkspaceDueAt(data.id);
  }
  return true;
}

async function updateWorkspaceByUserId(
  userId: string,
  patch: WorkspacePatch,
  email?: string | null,
  workspaceName?: string | null,
  preferredWorkspaceId?: string | null,
  refreshDueAt = false
) {
  await upsertProfileIdentity(userId, email);
  const workspaceId = await ensureWorkspaceForUser(userId, email, workspaceName, preferredWorkspaceId);
  await updateWorkspaceById(workspaceId, patch, refreshDueAt);
}

async function updateWorkspaceByEmail(
  email: string,
  patch: WorkspacePatch,
  workspaceName?: string | null,
  preferredWorkspaceId?: string | null,
  refreshDueAt = false
): Promise<boolean> {
  const profile = await findUserByEmail(email);
  if (!profile?.id) return false;
  await updateWorkspaceByUserId(profile.id, patch, profile.email ?? email, workspaceName, preferredWorkspaceId, refreshDueAt);
  return true;
}

async function resolvePlanFromSession(session: Stripe.Checkout.Session): Promise<BillingPlan> {
  const metadataPlan = typeof session.metadata?.plan_slug === "string" ? session.metadata.plan_slug : session.metadata?.plan;
  if (typeof metadataPlan === "string" && metadataPlan.trim()) {
    return normalizeWebhookPlan(metadataPlan);
  }
  if (!session.id) return "starter";

  const lineItems = await getStripe().checkout.sessions.listLineItems(session.id, { limit: 100 });
  for (const item of lineItems.data) {
    const priceId = item.price?.id;
    if (!priceId) continue;
    const plan = getPlanFromStripePriceId(priceId);
    if (plan) return plan;
  }
  return "pro";
}

async function markWebhookEventAsProcessing(event: Stripe.Event): Promise<boolean> {
  if (!event.id) return true;

  const admin = createServiceRoleClient();
  try {
    const { error } = await admin.from("stripe_webhook_events").insert({
      event_id: event.id,
      event_type: event.type
    });

    if (!error) return true;
    const code = "code" in error ? String((error as { code?: string }).code ?? "") : "";
    if (code === "23505") {
      if (isDev) console.info("[stripe] duplicate event ignored");
      return false;
    }
    if (isKnownMissingTableError(error)) {
      if (isDev) console.warn("[stripe] stripe_webhook_events table missing, duplicate protection disabled");
      return true;
    }
    throw error;
  } catch (error) {
    if (isKnownMissingTableError(error)) {
      if (isDev) console.warn("[stripe] stripe_webhook_events table missing, duplicate protection disabled");
      return true;
    }
    throw error;
  }
}

async function releaseWebhookEvent(eventId: string | undefined) {
  if (!eventId) return;
  const admin = createServiceRoleClient();
  try {
    const { error } = await admin.from("stripe_webhook_events").delete().eq("event_id", eventId);
    if (error && !isKnownMissingTableError(error)) throw error;
  } catch (error) {
    if (isDev) {
      console.warn("[stripe] failed to release webhook event reservation", {
        eventId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

async function applySubscriptionPatchFromSubscription(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
  if (!customerId) return;

  const patch: WorkspacePatch = {
    ...buildSubscriptionPatch(subscription),
    stripe_customer_id: customerId
  };
  const updated = await updateWorkspaceByCustomerId(customerId, patch, true);

  if (!updated && isDev) {
    console.warn("[stripe] subscription event ignored for unknown customer", { customerId, subscriptionId: subscription.id });
  }
}

function resolveInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const parentSubscription = invoice.parent?.subscription_details?.subscription;
  if (typeof parentSubscription === "string") return parentSubscription;

  const legacySubscription = (invoice as Stripe.Invoice & { subscription?: unknown }).subscription;
  return typeof legacySubscription === "string" ? legacySubscription : null;
}

async function applyInvoiceStatus(invoice: Stripe.Invoice, fallbackStatus: string) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
  if (!customerId) return;

  const subscriptionId = resolveInvoiceSubscriptionId(invoice);
  if (subscriptionId) {
    try {
      const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
      await applySubscriptionPatchFromSubscription(subscription);
      return;
    } catch (error) {
      if (isDev) {
        console.warn("[stripe] failed to resolve subscription from invoice", {
          customerId,
          subscriptionId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  const updated = await updateWorkspaceByCustomerId(
    customerId,
    {
      stripe_customer_id: customerId,
      subscription_status: fallbackStatus
    },
    fallbackStatus === "active"
  );

  if (!updated && isDev) {
    console.warn("[stripe] invoice event ignored for unknown customer", { customerId, invoiceId: invoice.id });
  }
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  const shouldProcess = await markWebhookEventAsProcessing(event);
  if (!shouldProcess) return;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email ?? session.customer_email;
        const customerId = typeof session.customer === "string" ? session.customer : null;
        const workspaceName = typeof session.metadata?.workspace_name === "string" ? session.metadata.workspace_name : null;
        const workspaceId = typeof session.metadata?.workspace_id === "string" && session.metadata.workspace_id.trim()
          ? session.metadata.workspace_id
          : null;
        const userId = typeof session.metadata?.user_id === "string" ? session.metadata.user_id : null;

        const checkoutPlan = await resolvePlanFromSession(session);
        let patch: WorkspacePatch = {
          plan: checkoutPlan,
          stripe_customer_id: customerId,
          subscription_name: toSubscriptionName(checkoutPlan)
        };

        if (typeof session.subscription === "string") {
          const subscription = await getStripe().subscriptions.retrieve(session.subscription);
          patch = {
            ...patch,
            ...buildSubscriptionPatch(subscription),
            plan: checkoutPlan
          };
        }

        if (userId) {
          await updateWorkspaceByUserId(userId, patch, email ?? null, workspaceName, workspaceId, true);
          if (email) await sendCheckoutConfirmationEmails(email, checkoutPlan, session);
          break;
        }

        if (email) {
          const updated = await updateWorkspaceByEmail(email, patch, workspaceName, workspaceId, true);
          if (!updated && customerId) {
            const applied = await updateWorkspaceByCustomerId(customerId, patch, true);
            if (!applied && isDev) {
              console.warn("[stripe] checkout session ignored for unknown email and customer", { email, customerId, sessionId: session.id });
            }
          }
          await sendCheckoutConfirmationEmails(email, checkoutPlan, session);
          break;
        }

        if (customerId) {
          const updated = await updateWorkspaceByCustomerId(customerId, patch, true);
          if (!updated && isDev) {
            console.warn("[stripe] checkout session ignored for unknown customer without resolvable email", { customerId, sessionId: session.id });
          }
          break;
        }

        throw new Error("Missing identifiers in checkout.session.completed webhook");
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await applySubscriptionPatchFromSubscription(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
        if (!customerId) break;

        const updated = await updateWorkspaceByCustomerId(customerId, {
          plan: "starter",
          stripe_customer_id: customerId,
          stripe_subscription_id: null,
          stripe_price_id: null,
          subscription_name: "Starter",
          subscription_status: "canceled",
          current_period_end: null
        });

        if (!updated && isDev) {
          console.warn("[stripe] subscription deletion ignored for unknown customer", { customerId, subscriptionId: subscription.id });
        }
        break;
      }

      case "invoice.paid": {
        await applyInvoiceStatus(event.data.object as Stripe.Invoice, "active");
        break;
      }

      case "invoice.payment_failed": {
        await applyInvoiceStatus(event.data.object as Stripe.Invoice, "past_due");
        break;
      }

      default: {
        if (isDev) console.info(`[stripe] ignored event type=${event.type}`);
        break;
      }
    }
  } catch (error) {
    await releaseWebhookEvent(event.id);
    throw error;
  }
}
