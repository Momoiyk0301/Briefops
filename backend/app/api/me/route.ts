import { NextResponse } from "next/server";

import { createRequestContext, toErrorResponse } from "@/http";
import { getCurrentMonthUsage } from "@/supabase/queries/usage";
import { requireAuthContext } from "@/supabase/server";

export async function GET(request: Request) {
  const ctx = createRequestContext("GET /api/me");

  try {
    const { client, userId, email } = await requireAuthContext(request);

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("plan,subscription_name,subscription_status,stripe_price_id,current_period_end,onboarding_step")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw profileError;

    const { data: membership, error: membershipError } = await client
      .from("memberships")
      .select("workspace_id,role")
      .eq("user_id", userId)
      .maybeSingle();

    if (membershipError) throw membershipError;

    let workspace: { id: string; name: string } | null = null;
    if (membership?.workspace_id) {
      const { data: organization, error: organizationError } = await client
        .from("workspaces")
        .select("id,name")
        .eq("id", membership.workspace_id)
        .maybeSingle();

      if (organizationError) throw organizationError;
      workspace = organization ?? null;
    }

    const usage = await getCurrentMonthUsage(client, userId);
    const rawPlan = String(profile?.plan ?? "").toLowerCase();
    const plan = rawPlan === "start" ? "starter" : rawPlan || null;
    const used = Number(usage?.pdf_exports ?? 0);
    const planLimit = plan === "free" ? 3 : plan === "starter" ? 100 : plan === "plus" ? 300 : null;
    const remaining = planLimit === null ? null : Math.max(planLimit - used, 0);
    const hasMembership = Boolean(membership?.workspace_id);

    ctx.info("resolved me", {
      userId,
      hasMembership,
      membershipRole: membership?.role ?? null,
      membershipOrgId: membership?.workspace_id ?? null,
      hasWorkspace: Boolean(workspace),
      hasPlan: Boolean(profile?.plan),
      onboardingStep: profile?.onboarding_step ?? null
    });

    return NextResponse.json({
      user: { id: userId, email: email ?? "" },
      plan,
      subscription_name: profile?.subscription_name ?? null,
      subscription_status: profile?.subscription_status ?? null,
      stripe_price_id: profile?.stripe_price_id ?? null,
      current_period_end: profile?.current_period_end ?? null,
      usage: {
        pdf_exports_used: used,
        pdf_exports_limit: planLimit,
        pdf_exports_remaining: remaining
      },
      org: workspace,
      workspace,
      has_membership: hasMembership,
      onboarding_step: profile?.onboarding_step ?? null,
      role: membership?.role ?? null,
      is_admin: membership?.role === "owner" || membership?.role === "admin"
    });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
