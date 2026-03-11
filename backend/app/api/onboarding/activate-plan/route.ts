import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { createServiceRoleClient, requireAuthContext } from "@/supabase/server";

const bodySchema = z.object({
  plan: z.enum(["starter"])
});

export async function POST(request: Request) {
  const ctx = createRequestContext("POST /api/onboarding/activate-plan");

  try {
    const { client, userId, email } = await requireAuthContext(request);
    const { plan } = bodySchema.parse(await request.json());
    const admin = createServiceRoleClient();

    const { data: membership, error: membershipError } = await client
      .from("memberships")
      .select("org_id,role")
      .eq("user_id", userId)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership?.org_id) {
      throw new HttpError(409, "Workspace missing. Complete onboarding first.");
    }

    const { error: profileUpsertError } = await admin.from("profiles").upsert(
      {
        id: userId,
        email: email?.toLowerCase() ?? undefined
      },
      { onConflict: "id" }
    );
    if (profileUpsertError) throw profileUpsertError;

    const { error: profileUpdateError } = await admin
      .from("profiles")
      .update({
        plan,
        subscription_name: "Starter",
        subscription_status: "active",
        stripe_price_id: null,
        current_period_end: null,
        onboarding_step: "demo"
      })
      .eq("id", userId);
    if (profileUpdateError) throw profileUpdateError;

    const { error: membershipUpdateError } = await admin
      .from("memberships")
      .update({
        plan_name: "Starter",
        stripe_price_id: null,
        stripe_product_id: null
      })
      .eq("user_id", userId);
    if (membershipUpdateError) throw membershipUpdateError;

    ctx.info("activated onboarding plan", { userId, plan, workspaceId: membership.org_id });
    return NextResponse.json({ ok: true, plan, onboarding_step: "demo" });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
