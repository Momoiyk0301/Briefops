import Stripe from "stripe";

import { sendCheckoutConfirmationEmails } from "@/lib/mail";
import { createServiceRoleClient } from "@/supabase/server";
import { getPlanFromStripePriceId, getStripe, isDev } from "@/stripe/stripe";

const processedEventIds = new Set<string>();

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

function toPatchWithFallback(patch: ProfilePatch) {
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
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (membership) return;

  let orgId: string | null = null;
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
    org_id: orgId,
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
        org_id: orgId,
        user_id: userId,
        role: membershipPatch?.role ?? "owner"
      },
      { onConflict: "user_id" }
    );
    if (fallbackMembershipError) throw fallbackMembershipError;
  }
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
) {
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
  if (resolvedUserId) {
    await ensureMembershipForProfile(resolvedUserId, fallbackData?.email ?? null, orgName, membershipPatch, workspaceId);
  }
}

async function updatePlanByUserId(
  userId: string,
  patch: ProfilePatch,
  orgName?: string | null,
  membershipPatch?: MembershipPatch,
  workspaceId?: string | null
) {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("id,email")
    .maybeSingle();

  if (error) {
    if (!shouldFallbackToLegacyColumns(error)) {
      throw error;
    }

    const fallback = toPatchWithFallback(patch);
    const { data: fallbackData, error: fallbackError } = await admin
      .from("profiles")
      .update(fallback)
      .eq("id", userId)
      .select("id,email")
      .maybeSingle();
    if (fallbackError) throw fallbackError;
    await ensureMembershipForProfile(userId, fallbackData?.email ?? null, orgName, membershipPatch, workspaceId);
    return;
  }

  await ensureMembershipForProfile(userId, data?.email ?? null, orgName, membershipPatch, workspaceId);
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

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  if (event.id && processedEventIds.has(event.id)) {
    if (isDev) console.info("[stripe] duplicate event ignored", event.id);
    return;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email ?? session.customer_email;
      const customerId = typeof session.customer === "string" ? session.customer : null;
      const orgNameFromMetadata = typeof session.metadata?.org_name === "string" ? session.metadata.org_name : null;
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

      if (email) {
        await updatePlanByEmail(email, patch, orgNameFromMetadata, membershipPatch, workspaceIdFromMetadata);
        await sendCheckoutConfirmationEmails(email, checkoutPlan, session);
      } else if (userIdFromMetadata) {
        await updatePlanByUserId(userIdFromMetadata, patch, orgNameFromMetadata, membershipPatch, workspaceIdFromMetadata);
      } else if (customerId) {
        await updatePlanByCustomerId(customerId, patch, orgNameFromMetadata, membershipPatch, workspaceIdFromMetadata);
      } else {
        throw new Error("Missing identifiers in checkout.session.completed webhook");
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
      if (!customerId) break;

      const patch = {
        ...buildSubscriptionPatch(subscription),
        stripe_customer_id: customerId
      };
      await updatePlanByCustomerId(customerId, patch, null, {
        role: "owner",
        plan_name: toSubscriptionName(resolvePlanFromSubscription(subscription)),
        stripe_price_id: patch.stripe_price_id ?? null,
        stripe_product_id: resolveStripeProductIdFromSubscription(subscription)
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
      if (!customerId) break;

      await updatePlanByCustomerId(customerId, {
        plan: "free",
        stripe_customer_id: customerId,
        stripe_subscription_id: null,
        stripe_price_id: null,
        subscription_name: "Free",
        subscription_status: "canceled",
        current_period_end: null
      });
      break;
    }

    default: {
      if (isDev) {
        console.log(`[stripe] ignored event type=${event.type}`);
      }
      break;
    }
  }

  if (event.id) processedEventIds.add(event.id);
}
