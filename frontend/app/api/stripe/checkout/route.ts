import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { createServiceRoleClient, requireAuthContext } from "@/supabase/server";
import { getPlanFromStripePriceId, getStripe, getStripePriceIdForPlan } from "@/stripe/stripe";
import { env } from "@/env";

export const runtime = "nodejs";
const bodySchema = z.object({
  plan: z.enum(["starter", "plus", "pro"]).optional(),
  stripe_price_id: z.string().trim().min(1).optional(),
  workspace_id: z.string().uuid().optional(),
  workspace_name: z.string().trim().min(2).max(120).optional()
    .or(z.literal("")),
  source: z.enum(["billing", "onboarding"]).optional()
});
const planRank: Record<string, number> = { free: 0, start: 1, starter: 1, plus: 2, pro: 3 };

function resolveAppUrl(request: Request): string {
  const origin = request.headers.get("origin");
  if (origin) return origin.replace(/\/$/, "");
  return env.APP_URL.replace(/\/$/, "");
}

export async function POST(request: Request) {
  const ctx = createRequestContext("POST /api/stripe/checkout");

  try {
    const { userId, email } = await requireAuthContext(request);
    const admin = createServiceRoleClient();
    const appUrl = resolveAppUrl(request);
    const body = bodySchema.parse(await request.json());
    const requestedPlan = body.plan ?? (body.stripe_price_id ? getPlanFromStripePriceId(body.stripe_price_id) : null);
    const source = body.source ?? "billing";
    const priceId = body.stripe_price_id ?? (body.plan ? getStripePriceIdForPlan(body.plan) : null);

    if (!priceId) {
      throw new HttpError(400, "Missing price identifier");
    }

    const { error: profileUpsertError } = await admin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: (email ?? "").toLowerCase() || undefined
        },
        { onConflict: "id" }
      );
    if (profileUpsertError) throw profileUpsertError;

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id,plan,stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) throw new HttpError(500, "Profile not found after upsert");

    const currentPlan = profile?.plan ?? "free";
    if (requestedPlan && (planRank[requestedPlan] ?? 0) <= (planRank[currentPlan] ?? 0)) {
      throw new HttpError(409, `Already on ${currentPlan} plan or higher`);
    }

    const { data: membership, error: membershipError } = await admin
      .from("memberships")
      .select("workspace_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (membershipError) throw membershipError;

    const workspaceId = body.workspace_id ?? membership?.workspace_id ?? null;

    const stripe = getStripe();
    let customerId = profile?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email ?? undefined,
        metadata: { user_id: userId }
      });
      customerId = customer.id;

      const { error: updateError } = await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
      if (updateError) throw updateError;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url:
        source === "onboarding"
          ? `${appUrl}/onboarding?step=demo&checkout=success&session_id={CHECKOUT_SESSION_ID}`
          : `${appUrl}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: source === "onboarding" ? `${appUrl}/onboarding?step=products&checkout=cancel` : `${appUrl}/account?checkout=cancel`,
      metadata: {
        user_id: userId,
        workspace_id: workspaceId ?? "",
        plan: requestedPlan ?? "",
        workspace_name: body.workspace_name ?? "",
        onboarding_source: source
      }
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
