import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { requireAuthContext } from "@/supabase/server";
import { getStripe, getStripePriceIdForPlan } from "@/stripe/stripe";
import { env } from "@/env";

export const runtime = "nodejs";
const bodySchema = z.object({
  plan: z.enum(["start", "pro"])
});
const planRank: Record<string, number> = { free: 0, start: 1, pro: 2 };

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
    const body = bodySchema.parse(await request.json());
    const requestedPlan = body.plan;

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("id,plan,stripe_customer_id")
      .eq("id", userId)
      .single();
    if (profileError) throw profileError;

    const currentPlan = profile?.plan ?? "free";
    if ((planRank[requestedPlan] ?? 0) <= (planRank[currentPlan] ?? 0)) {
      throw new HttpError(409, `Already on ${currentPlan} plan or higher`);
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
      line_items: [{ price: getStripePriceIdForPlan(requestedPlan), quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${appUrl}/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/settings/billing?checkout=cancel`,
      metadata: { user_id: userId, plan: requestedPlan }
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
