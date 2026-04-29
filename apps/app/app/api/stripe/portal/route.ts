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

    const { data: membership, error: membershipError } = await client
      .from("memberships")
      .select("workspace_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership?.workspace_id) {
      throw new HttpError(409, "No active workspace for this account.", "STRIPE_PORTAL_FAILED");
    }

    const { data: workspace, error: workspaceError } = await client
      .from("workspaces")
      .select("id,stripe_customer_id")
      .eq("id", membership.workspace_id)
      .maybeSingle();
    if (workspaceError) throw workspaceError;

    if (!workspace?.stripe_customer_id) {
      throw new HttpError(409, "No active Stripe billing for this account.", "STRIPE_PORTAL_FAILED");
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: workspace.stripe_customer_id,
      return_url: `${appUrl}/account?billing=returned`
    });

    ctx.info("created billing portal session", { userId });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId, {
      area: "stripe",
      action: "read",
      errorCode: "STRIPE_PORTAL_FAILED",
      severity: "medium",
      route: "POST /api/stripe/portal"
    });
  }
}
