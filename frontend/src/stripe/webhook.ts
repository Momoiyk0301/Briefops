import Stripe from "stripe";

import { sendCheckoutConfirmationEmails } from "@/lib/mail";
import { createServiceRoleClient } from "@/supabase/server";
import { getPlanFromStripePriceId, getStripe, isDev } from "@/stripe/stripe";

type ProfilePatch = {
  plan: "free" | "starter" | "plus" | "pro";
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  subscription_name?: string | null;
  subscription_status?: string | null;
  current_period_end?: string | null;
};

type MembershipPatch = {
  role: "owner" | "member";
  plan_name?: string | null;
  stripe_price_id?: string | null;
  stripe_product_id?: string | null;
};

function isKnownMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: string }).code ?? "") : "";
  const message = "message" in error ? String((error as { message?: string }).message ?? "") : "";
  return code === "42P01" || /relation .* does not exist/i.test(message);
}

function toPatchWithFallback(patch: ProfilePatch): ProfilePatch {
  return {
    plan: patch.plan,
    stripe_customer_id: patch.stripe_customer_id ?? null
  };
}

function shouldFallbackToLegacyColumns(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: string }).code ?? "") : "";
  const message = "message" in error ? String((error as { message?: string }).message ?? "") : "";
  return code === "42703" || /column .* does not exist/i.test(message);
}

function resolvePlanFromSubscription(subscription: Stripe.Subscription): "free" | "starter" | "plus" | "pro" {
  for (const item of subscription.items.data) {
    const priceId = item.price?.id;
    if (!priceId) continue;
    const plan = getPlanFromStripePriceId(priceId);
    if (plan) return plan;
  }
  return "free";
}

function toSubscriptionName(plan: "free" | "starter" | "plus" | "pro") {
  if (plan === "pro") return "Pro";
  if (plan === "plus") return "Plus";
  if (plan === "starter") return "Starter";
  return "Free";
}

function buildSubscriptionPatch(subscription: Stripe.Subscription): ProfilePatch {
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

function resolveStripeProductIdFromSubscription(subscription: Stripe.Subscription): string | null {
  const product = subscription.items.data[0]?.price?.product;
  return typeof product === "string" ? product : null;
}

function formatOrgNameFromEmail(email: string | null | undefined) {
  if (!email) return "BriefOPS Workspace";
  const local = email.split("@")[0]?.trim();
  if (!local) return "BriefOPS Workspace";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  return cleaned ? `${cleaned} workspace` : "BriefOPS Workspace";
}

async function ensureMembershipForProfile(
  userId: string,
  email?: string | null,
  orgName?: string | null,
  membershipPatch?: MembershipPatch,
  workspaceId?: string | null
) {
  const admin = createServiceRoleClient();
  const { data: membership, error: membershipError } = await admin
    .from("memberships")
    .select("id,workspace_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError) throw membershipError;

  let orgId: string | null = membership?.workspace_id ?? null;
  if (workspaceId) {
    const { data: existingWorkspace, error: existingWorkspaceError } = await admin
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .maybeSingle();
    if (existingWorkspaceError) throw existingWorkspaceError;
    orgId = existingWorkspace?.id ?? null;
  }

  if (!orgId) {
    const { data: org, error: orgError } = await admin
      .from("workspaces")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (orgError) throw orgError;
    if (org?.id) {
      orgId = org.id;
    }
  }

  if (!orgId) {
    const normalizedOrgName = typeof orgName === "string" ? orgName.trim() : "";
    const { data: createdOrg, error: createOrgError } = await admin
      .from("workspaces")
      .insert({
        owner_id: userId,
        name: normalizedOrgName || formatOrgNameFromEmail(email)
      })
      .select("id")
      .single();
    if (createOrgError) throw createOrgError;
    orgId = createdOrg.id;
  }

  const payload = {
    workspace_id: orgId,
    user_id: userId,
    role: membershipPatch?.role ?? "owner",
    plan_name: membershipPatch?.plan_name ?? null,
    stripe_price_id: membershipPatch?.stripe_price_id ?? null,
    stripe_product_id: membershipPatch?.stripe_product_id ?? null
  };
  const { error: insertMembershipError } = await admin.from("memberships").upsert(payload, { onConflict: "user_id" });
  if (insertMembershipError) {
    if (!shouldFallbackToLegacyColumns(insertMembershipError)) throw insertMembershipError;
    const { error: fallbackMembershipError } = await admin.from("memberships").upsert(
      {
        workspace_id: orgId,
        user_id: userId,
        role: membershipPatch?.role ?? "owner"
      },
      { onConflict: "user_id" }
    );
    if (fallbackMembershipError) throw fallbackMembershipError;
  }
}

async function upsertProfileByUserId(
  userId: string,
  patch: ProfilePatch,
  email?: string | null
): Promise<{ id?: string; email?: string } | null> {
  const admin = createServiceRoleClient();
  const normalizedEmail = email?.toLowerCase().trim() || undefined;

  const { data, error } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        email: normalizedEmail,
        ...patch
      },
      { onConflict: "id" }
    )
    .select("id,email")
    .maybeSingle();

  if (!error) return data;
  if (!shouldFallbackToLegacyColumns(error)) throw error;

  const { data: fallbackData, error: fallbackError } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        email: normalizedEmail,
        ...toPatchWithFallback(patch)
      },
      { onConflict: "id" }
    )
    .select("id,email")
    .maybeSingle();

  if (fallbackError) throw fallbackError;
  return fallbackData;
}

async function updatePlanByEmail(
  email: string,
  patch: ProfilePatch,
  orgName?: string | null,
  membershipPatch?: MembershipPatch,
  workspaceId?: string | null
) {
  const admin = createServiceRoleClient();

  const normalizedEmail = email.toLowerCase().trim();
  const { data, error } = await admin
    .from("profiles")
    .update(patch)
    .eq("email", normalizedEmail)
    .select("id,email")
    .maybeSingle();
  let fallbackData: { id?: string; email?: string } | null = null;
  if (error) {
    if (!shouldFallbackToLegacyColumns(error)) {
      throw error;
    }

    const fallback = toPatchWithFallback(patch);
    const { data: resolvedFallbackData, error: fallbackError } = await admin
      .from("profiles")
      .update(fallback)
      .eq("email", normalizedEmail)
      .select("id,email")
      .maybeSingle();
    if (fallbackError) throw fallbackError;
    fallbackData = resolvedFallbackData;
  }

  const resolvedUserId = data?.id ?? fallbackData?.id ?? null;
  if (resolvedUserId) {
    await ensureMembershipForProfile(resolvedUserId, fallbackData?.email ?? normalizedEmail, orgName, membershipPatch, workspaceId);
  }
}

async function updatePlanByCustomerId(
  customerId: string,
  patch: ProfilePatch,
  orgName?: string | null,
  membershipPatch?: MembershipPatch,
  workspaceId?: string | null
): Promise<boolean> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("profiles")
    .update(patch)
    .eq("stripe_customer_id", customerId)
    .select("id,email")
    .maybeSingle();
  let fallbackData: { id?: string; email?: string } | null = null;
  if (error) {
    if (!shouldFallbackToLegacyColumns(error)) {
      throw error;
    }

    const fallback = { plan: patch.plan };
    const { data: resolvedFallbackData, error: fallbackError } = await admin
      .from("profiles")
      .update(fallback)
      .eq("stripe_customer_id", customerId)
      .select("id,email")
      .maybeSingle();
    if (fallbackError) throw fallbackError;
    fallbackData = resolvedFallbackData;
  }

  const resolvedUserId = data?.id ?? fallbackData?.id ?? null;
  if (!resolvedUserId) return false;

  await ensureMembershipForProfile(resolvedUserId, fallbackData?.email ?? null, orgName, membershipPatch, workspaceId);
  return true;
}

async function updatePlanByUserId(
  userId: string,
  patch: ProfilePatch,
  email?: string | null,
  orgName?: string | null,
  membershipPatch?: MembershipPatch,
  workspaceId?: string | null
) {
  const profile = await upsertProfileByUserId(userId, patch, email);
  await ensureMembershipForProfile(userId, profile?.email ?? email ?? null, orgName, membershipPatch, workspaceId);
}

async function updateSubscriptionStatusByCustomerId(
  customerId: string,
  patch: Pick<ProfilePatch, "subscription_status" | "current_period_end" | "stripe_subscription_id" | "stripe_customer_id">
): Promise<boolean> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("profiles")
    .update(patch)
    .eq("stripe_customer_id", customerId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.id);
}

async function resolvePlanFromSession(session: Stripe.Checkout.Session): Promise<"free" | "starter" | "plus" | "pro"> {
  if (!session.id) return "free";

  const lineItems = await getStripe().checkout.sessions.listLineItems(session.id, { limit: 100 });
  for (const item of lineItems.data) {
    const priceId = item.price?.id;
    if (!priceId) continue;
    const plan = getPlanFromStripePriceId(priceId);
    if (plan) return plan;
  }
  return "free";
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

  const patch = {
    ...buildSubscriptionPatch(subscription),
    stripe_customer_id: customerId
  };
  const updated = await updatePlanByCustomerId(customerId, patch, null, {
    role: "owner",
    plan_name: toSubscriptionName(resolvePlanFromSubscription(subscription)),
    stripe_price_id: patch.stripe_price_id ?? null,
    stripe_product_id: resolveStripeProductIdFromSubscription(subscription)
  });

  if (!updated && isDev) {
    console.warn("[stripe] subscription event ignored for unknown customer", { customerId, subscriptionId: subscription.id });
  }
}

function resolveInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const parentSubscription = invoice.parent?.subscription_details?.subscription;
  if (typeof parentSubscription === "string") {
    return parentSubscription;
  }

  const legacySubscription = (invoice as Stripe.Invoice & { subscription?: unknown }).subscription;
  return typeof legacySubscription === "string" ? legacySubscription : null;
}

async function applyInvoiceStatus(
  invoice: Stripe.Invoice,
  fallbackStatus: string
) {
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

  const updated = await updateSubscriptionStatusByCustomerId(customerId, {
    stripe_customer_id: customerId,
    subscription_status: fallbackStatus
  });

  if (!updated && isDev) {
    console.warn("[stripe] invoice event ignored for unknown customer", { customerId, invoiceId: invoice.id });
  }
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  const shouldProcess = await markWebhookEventAsProcessing(event);
  if (!shouldProcess) {
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email ?? session.customer_email;
        const customerId = typeof session.customer === "string" ? session.customer : null;
        const workspaceNameFromMetadata = typeof session.metadata?.workspace_name === "string" ? session.metadata.workspace_name : null;
        const workspaceIdFromMetadata = typeof session.metadata?.workspace_id === "string" && session.metadata.workspace_id.trim()
          ? session.metadata.workspace_id
          : null;
        const userIdFromMetadata = typeof session.metadata?.user_id === "string" ? session.metadata.user_id : null;

        const checkoutPlan = await resolvePlanFromSession(session);
        let patch: ProfilePatch = {
          plan: checkoutPlan,
          stripe_customer_id: customerId
        };
        let membershipPatch: MembershipPatch = {
          role: "owner",
          plan_name: toSubscriptionName(checkoutPlan),
          stripe_price_id: null,
          stripe_product_id: null
        };

        if (typeof session.subscription === "string") {
          const subscription = await getStripe().subscriptions.retrieve(session.subscription);
          patch = {
            ...patch,
            ...buildSubscriptionPatch(subscription)
          };
          membershipPatch = {
            role: "owner",
            plan_name: toSubscriptionName(checkoutPlan),
            stripe_price_id: patch.stripe_price_id ?? null,
            stripe_product_id: resolveStripeProductIdFromSubscription(subscription)
          };
        } else {
          patch.subscription_name = toSubscriptionName(checkoutPlan);
        }

        if (userIdFromMetadata) {
          await updatePlanByUserId(userIdFromMetadata, patch, email ?? null, workspaceNameFromMetadata, membershipPatch, workspaceIdFromMetadata);
          if (email) {
            await sendCheckoutConfirmationEmails(email, checkoutPlan, session);
          }
        } else if (email) {
          await updatePlanByEmail(email, patch, workspaceNameFromMetadata, membershipPatch, workspaceIdFromMetadata);
          await sendCheckoutConfirmationEmails(email, checkoutPlan, session);
        } else if (customerId) {
          const updated = await updatePlanByCustomerId(customerId, patch, workspaceNameFromMetadata, membershipPatch, workspaceIdFromMetadata);
          if (!updated && isDev) {
            console.warn("[stripe] checkout session ignored for unknown customer without resolvable email", { customerId, sessionId: session.id });
          }
        } else {
          throw new Error("Missing identifiers in checkout.session.completed webhook");
        }
        break;
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

        const updated = await updatePlanByCustomerId(customerId, {
          plan: "free",
          stripe_customer_id: customerId,
          stripe_subscription_id: null,
          stripe_price_id: null,
          subscription_name: "Free",
          subscription_status: "canceled",
          current_period_end: null
        });

        if (!updated && isDev) {
          console.warn("[stripe] subscription deletion ignored for unknown customer", { customerId, subscriptionId: subscription.id });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await applyInvoiceStatus(invoice, "active");
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await applyInvoiceStatus(invoice, "past_due");
        break;
      }

      default: {
        if (isDev) {
          console.info(`[stripe] ignored event type=${event.type}`);
        }
        break;
      }
    }
  } catch (error) {
    await releaseWebhookEvent(event.id);
    throw error;
  }
}
