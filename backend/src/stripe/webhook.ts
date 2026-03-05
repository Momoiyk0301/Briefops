import Stripe from "stripe";

import { env } from "@/env";
import { createServiceRoleClient } from "@/supabase/server";
import { getPlanFromStripePriceId, getStripe, isDev } from "@/stripe/stripe";

const processedEventIds = new Set<string>();

type ResendConfig = {
  apiKey: string;
  from: string;
};

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
  role: "member";
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

function getResendConfig(): ResendConfig | null {
  const apiKey = String(process.env.RESEND_API_KEY ?? "").trim();
  const from = String(process.env.MAIL_FROM ?? "").trim();
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

async function sendResendEmail(config: ResendConfig, to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: config.from,
      to: [to],
      subject,
      html
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Resend error: ${message}`);
  }
}

async function sendPostCheckoutEmails(email: string, plan: "free" | "starter" | "plus" | "pro", session: Stripe.Checkout.Session) {
  const config = getResendConfig();
  if (!config) {
    if (isDev) {
      console.info("[mail] skipped: RESEND_API_KEY or MAIL_FROM missing");
    }
    return;
  }

  const appUrl = env.APP_URL.replace(/\/$/, "");
  if (plan === "free") return;
  const sessionId = session.id ?? "n/a";
  const amount = typeof session.amount_total === "number" ? (session.amount_total / 100).toFixed(2) : null;
  const currency = (session.currency ?? "eur").toUpperCase();

  await sendResendEmail(
    config,
    email,
    `Commande BriefOPS confirmée (${plan.toUpperCase()})`,
    `
      <div style="font-family:Arial,sans-serif;line-height:1.5;">
        <h2>Merci pour ta commande BriefOPS</h2>
        <p>Ton abonnement <strong>${plan.toUpperCase()}</strong> est actif.</p>
        <p>Session Stripe: <code>${sessionId}</code></p>
        ${amount ? `<p>Montant: <strong>${amount} ${currency}</strong></p>` : ""}
        <p>Accéder à ton espace: <a href="${appUrl}/briefings">${appUrl}/briefings</a></p>
      </div>
    `
  );

  await sendResendEmail(
    config,
    email,
    "Confirmation de compte BriefOPS",
    `
      <div style="font-family:Arial,sans-serif;line-height:1.5;">
        <h2>Compte BriefOPS confirmé</h2>
        <p>Ton paiement a été validé, ton compte est bien activé.</p>
        <p>Tu peux continuer ici: <a href="${appUrl}/auth/confirmed">${appUrl}/auth/confirmed</a></p>
      </div>
    `
  );
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
  membershipPatch?: MembershipPatch
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
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (orgError) throw orgError;
  if (org?.id) {
    orgId = org.id;
  } else {
    const normalizedOrgName = typeof orgName === "string" ? orgName.trim() : "";
    const { data: createdOrg, error: createOrgError } = await admin
      .from("organizations")
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
    role: "member" as const,
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
        role: "member"
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
  membershipPatch?: MembershipPatch
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
    await ensureMembershipForProfile(resolvedUserId, fallbackData?.email ?? normalizedEmail, orgName, membershipPatch);
  }
}

async function updatePlanByCustomerId(
  customerId: string,
  patch: ProfilePatch,
  orgName?: string | null,
  membershipPatch?: MembershipPatch
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
    await ensureMembershipForProfile(resolvedUserId, fallbackData?.email ?? null, orgName, membershipPatch);
  }
}

async function updatePlanByUserId(
  userId: string,
  patch: ProfilePatch,
  orgName?: string | null,
  membershipPatch?: MembershipPatch
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
    await ensureMembershipForProfile(userId, fallbackData?.email ?? null, orgName, membershipPatch);
    return;
  }

  await ensureMembershipForProfile(userId, data?.email ?? null, orgName, membershipPatch);
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
      const userIdFromMetadata = typeof session.metadata?.user_id === "string" ? session.metadata.user_id : null;

      const checkoutPlan = await resolvePlanFromSession(session);
      let patch: ProfilePatch = {
        plan: checkoutPlan,
        stripe_customer_id: customerId
      };
      let membershipPatch: MembershipPatch = {
        role: "member",
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
          role: "member",
          plan_name: toSubscriptionName(checkoutPlan),
          stripe_price_id: patch.stripe_price_id ?? null,
          stripe_product_id: resolveStripeProductIdFromSubscription(subscription)
        };
      } else {
        patch.subscription_name = toSubscriptionName(checkoutPlan);
      }

      if (email) {
        await updatePlanByEmail(email, patch, orgNameFromMetadata, membershipPatch);
        await sendPostCheckoutEmails(email, checkoutPlan, session);
      } else if (userIdFromMetadata) {
        await updatePlanByUserId(userIdFromMetadata, patch, orgNameFromMetadata, membershipPatch);
      } else if (customerId) {
        await updatePlanByCustomerId(customerId, patch, orgNameFromMetadata, membershipPatch);
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
        role: "member",
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
