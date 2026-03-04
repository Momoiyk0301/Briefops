import Stripe from "stripe";

import { createServiceRoleClient } from "@/supabase/server";
import { getStripe, getStripePriceId, isDev } from "@/stripe/stripe";

const processedEventIds = new Set<string>();

type ProfilePatch = {
  plan: "free" | "pro";
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  subscription_name?: string | null;
  subscription_status?: string | null;
  current_period_end?: string | null;
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

function buildSubscriptionPatch(subscription: Stripe.Subscription): ProfilePatch {
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const plan = isProFromSubscription(subscription) ? "pro" : "free";

  return {
    plan,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    subscription_name: plan === "pro" ? "Pro" : "Free",
    subscription_status: subscription.status,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
  };
}

async function updatePlanByEmail(email: string, patch: ProfilePatch) {
  const admin = createServiceRoleClient();

  const normalizedEmail = email.toLowerCase().trim();
  const { error } = await admin.from("profiles").update(patch).eq("email", normalizedEmail);
  if (!error) return;

  if (!shouldFallbackToLegacyColumns(error)) {
    throw error;
  }

  const fallback = toPatchWithFallback(patch);
  const { error: fallbackError } = await admin.from("profiles").update(fallback).eq("email", normalizedEmail);
  if (fallbackError) throw fallbackError;
}

async function updatePlanByCustomerId(customerId: string, patch: ProfilePatch) {
  const admin = createServiceRoleClient();
  const { error } = await admin.from("profiles").update(patch).eq("stripe_customer_id", customerId);
  if (!error) return;

  if (!shouldFallbackToLegacyColumns(error)) {
    throw error;
  }

  const fallback = { plan: patch.plan };
  const { error: fallbackError } = await admin.from("profiles").update(fallback).eq("stripe_customer_id", customerId);
  if (fallbackError) throw fallbackError;
}

async function isProFromSession(session: Stripe.Checkout.Session): Promise<boolean> {
  if (!session.id) return false;

  const lineItems = await getStripe().checkout.sessions.listLineItems(session.id, { limit: 100 });
  return lineItems.data.some((item) => item.price?.id === getStripePriceId());
}

function isProFromSubscription(subscription: Stripe.Subscription): boolean {
  return subscription.items.data.some((item) => item.price.id === getStripePriceId());
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

      if (!email) break;

      const isPro = await isProFromSession(session);
      let patch: ProfilePatch = {
        plan: isPro ? "pro" : "free",
        stripe_customer_id: customerId
      };

      if (typeof session.subscription === "string") {
        const subscription = await getStripe().subscriptions.retrieve(session.subscription);
        patch = {
          ...patch,
          ...buildSubscriptionPatch(subscription)
        };
      } else {
        patch.subscription_name = isPro ? "Pro" : "Free";
      }

      await updatePlanByEmail(email, patch);
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
      await updatePlanByCustomerId(customerId, patch);
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
