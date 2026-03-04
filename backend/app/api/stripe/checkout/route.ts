import { NextResponse } from "next/server";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { requireAuthContext } from "@/supabase/server";
import { getStripe, getStripePriceId } from "@/stripe/stripe";
import { env } from "@/env";

export const runtime = "nodejs";

function resolveAppUrl(request: Request): string {
  const origin = request.headers.get("origin");
  if (origin) return origin.replace(/\/$/, "");
  return env.APP_URL.replace(/\/$/, "");
}

export async function POST(request: Request) {
  const ctx = createRequestContext("POST /api/stripe/checkout");

  try {
    const { client, userId, email } = await requireAuthContext(request);
    const appUrl = resolveAppUrl(request);

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("id,plan,stripe_customer_id")
      .eq("id", userId)
      .single();
    if (profileError) throw profileError;

    if (profile?.plan === "pro") {
      throw new HttpError(409, "Already on Pro plan");
    }

    const stripe = getStripe();
    let customerId = profile?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email ?? undefined,
        metadata: { user_id: userId }
      });
      customerId = customer.id;

      const { error: updateError } = await client
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
      if (updateError) throw updateError;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: getStripePriceId(), quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${appUrl}/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/settings/billing?checkout=cancel`,
      metadata: { user_id: userId }
    });

    if (!session.url) {
      throw new HttpError(500, "Missing checkout session URL");
    }

    ctx.info("created checkout session", { userId, sessionId: session.id });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
