import Stripe from "stripe";

import { env } from "@/env";
import { createServiceRoleClient } from "@/supabase/server";
import { isDev, stripe } from "@/stripe/stripe";

async function updatePlanByEmail(email: string, plan: "free" | "pro", stripeCustomerId?: string | null) {
  const admin = createServiceRoleClient();

  const payload: Record<string, string> = { plan };
  if (stripeCustomerId) {
    payload.stripe_customer_id = stripeCustomerId;
  }

  const { error } = await admin.from("profiles").update(payload).eq("email", email.toLowerCase());
  if (error) throw error;
}

async function updatePlanByCustomerId(customerId: string, plan: "free" | "pro") {
  const admin = createServiceRoleClient();
  const { error } = await admin.from("profiles").update({ plan }).eq("stripe_customer_id", customerId);
  if (error) throw error;
}

async function isProFromSession(session: Stripe.Checkout.Session): Promise<boolean> {
  if (!session.id) return false;

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
  return lineItems.data.some((item) => item.price?.id === env.STRIPE_PRICE_ID);
}

function isProFromSubscription(subscription: Stripe.Subscription): boolean {
  return subscription.items.data.some((item) => item.price.id === env.STRIPE_PRICE_ID);
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email ?? session.customer_email;
      const customerId = typeof session.customer === "string" ? session.customer : null;

      if (!email) break;

      const isPro = await isProFromSession(session);
      await updatePlanByEmail(email, isPro ? "pro" : "free", customerId);
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
      if (!customerId) break;

      const plan = isProFromSubscription(subscription) ? "pro" : "free";
      await updatePlanByCustomerId(customerId, plan);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
      if (!customerId) break;

      await updatePlanByCustomerId(customerId, "free");
      break;
    }

    default: {
      if (isDev) {
        console.log(`[stripe] ignored event type=${event.type}`);
      }
      break;
    }
  }
}
