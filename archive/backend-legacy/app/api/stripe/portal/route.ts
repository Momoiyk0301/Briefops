import { NextResponse } from "next/server";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { requireAuthContext } from "@/supabase/server";
import { getStripe } from "@/stripe/stripe";
import { env } from "@/env";

export const runtime = "nodejs";

function resolveAppUrl(request: Request): string {
  const origin = request.headers.get("origin");
  if (origin) return origin.replace(/\/$/, "");
  return env.APP_URL.replace(/\/$/, "");
}

export async function POST(request: Request) {
  const ctx = createRequestContext("POST /api/stripe/portal");

  try {
    const { client, userId } = await requireAuthContext(request);
    const appUrl = resolveAppUrl(request);

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("id,stripe_customer_id")
      .eq("id", userId)
      .single();
    if (profileError) throw profileError;

    if (!profile?.stripe_customer_id) {
      throw new HttpError(400, "Missing stripe customer. Start checkout first.");
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/settings/billing`
    });

    ctx.info("created billing portal session", { userId });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
