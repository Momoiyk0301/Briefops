import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { getPlanLimits } from "@/lib/quotas";
import { getCurrentMonthUsage } from "@/supabase/queries/usage";
import { requireAuthContext } from "@/supabase/server";

export async function GET(request: Request) {
  const ctx = createRequestContext("GET /api/me", request);

  try {
    const { client, userId, email } = await requireAuthContext(request);

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("full_name,avatar_path,plan,subscription_name,subscription_status,stripe_price_id,current_period_end,onboarding_step")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw profileError;

    const { data: membership, error: membershipError } = await client
      .from("memberships")
      .select("workspace_id,role")
      .eq("user_id", userId)
      .maybeSingle();

    if (membershipError) throw membershipError;

    let workspace: { id: string; name: string; initials?: string | null; logo_path?: string | null } | null = null;
    if (membership?.workspace_id) {
      const { data: resolvedWorkspace, error: organizationError } = await client
        .from("workspaces")
        .select("id,name,initials,logo_path")
        .eq("id", membership.workspace_id)
        .maybeSingle();

      if (organizationError) throw organizationError;
      workspace = resolvedWorkspace ?? null;
    }

    const usage = await getCurrentMonthUsage(client, userId);
    const rawPlan = String(profile?.plan ?? "").toLowerCase();
    const plan = rawPlan || null;
    const used = Number(usage?.pdf_exports ?? 0);
    const pdfLimit = getPlanLimits(plan).pdf_month;
    const planLimit = Number.isFinite(pdfLimit) ? pdfLimit : null;
    const remaining = planLimit === null ? null : Math.max(planLimit - used, 0);
    const hasMembership = Boolean(membership?.workspace_id);

    ctx.info("resolved me", {
      userId,
      hasMembership,
      membershipRole: membership?.role ?? null,
      membershipWorkspaceId: membership?.workspace_id ?? null,
      hasWorkspace: Boolean(workspace),
      hasPlan: Boolean(profile?.plan),
      onboardingStep: profile?.onboarding_step ?? null
    });

    return NextResponse.json({
      user: {
        id: userId,
        email: email ?? "",
        full_name: profile?.full_name ?? null,
        avatar_path: profile?.avatar_path ?? null,
        initials: null
      },
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
    ctx.captureException("failed to resolve me", error, {
      origin: "server",
      step: "load-me"
    });
    return toErrorResponse(error, ctx.requestId);
  }
}

const patchSchema = z.object({
  avatar_path: z.string().trim().min(1).nullable().optional()
});

export async function PATCH(request: Request) {
  const ctx = createRequestContext("PATCH /api/me", request);

  try {
    const { client, userId } = await requireAuthContext(request);
    const payload = patchSchema.parse(await request.json());

    const { data, error } = await client
      .from("profiles")
      .update({ avatar_path: payload.avatar_path ?? null })
      .eq("id", userId)
      .select("id,avatar_path")
      .single();

    if (error) throw error;
    if (!data) throw new HttpError(404, "Profile not found");

    return NextResponse.json({ data });
  } catch (error) {
    ctx.captureException("failed to update me", error, {
      origin: "server",
      step: "update-me"
    });
    return toErrorResponse(error, ctx.requestId);
  }
}
