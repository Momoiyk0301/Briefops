import Stripe from "stripe";

import { env, serverEnv } from "@/env";

export const stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  appInfo: {
    name: "briefops-backend",
    version: "0.1.0",
    url: env.APP_URL
  }
});

export const isDev = env.NODE_ENV === "development";
