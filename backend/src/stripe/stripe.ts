import Stripe from "stripe";

import { env, getStripeEnv } from "@/env";

let stripeInstance: Stripe | null = null;

function getOrCreateStripe() {
  if (stripeInstance) return stripeInstance;

  const stripeEnv = getStripeEnv();
  stripeInstance = new Stripe(stripeEnv.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
    appInfo: {
      name: "briefops-backend",
      version: "0.1.0",
      url: env.APP_URL
    }
  });

  return stripeInstance;
}

export function getStripe() {
  return getOrCreateStripe();
}

export function getStripePriceId() {
  return getStripeEnv().STRIPE_PRICE_ID;
}

export function getStripeWebhookSecret() {
  return getStripeEnv().STRIPE_WEBHOOK_SECRET;
}

export const isDev = env.NODE_ENV === "development";
