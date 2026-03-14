import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, toErrorResponse } from "@/http";
import { getInitials } from "@/lib/branding";
import { getRemainingQuota } from "@/lib/quotas";
import { requireAuthContext } from "@/supabase/server";

const patchSchema = z.object({
  avatar_path: z.string().trim().min(1).nullable().optional()
});

export async function GET(request: Request) {
  const ctx = createRequestContext("GET /api/me");

  try {
    const { client, userId, email } = await requireAuthContext(request);

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("full_name,avatar_path,onboarding_step")
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
      const { data: resolvedWorkspace, error: organizationError } = await client
        .from("workspaces")
        .select("id,name,storage_used_bytes,briefings_count,pdf_exports_month,pdf_exports_reset_at,logo_path,initials,due_at,plan,stripe_price_id,subscription_name,subscription_status,current_period_end")
        .eq("id", membership.workspace_id)
        .maybeSingle();

      if (organizationError) throw organizationError;
      workspace = resolvedWorkspace ?? null;
    }

    const rawPlan = String(workspace && "plan" in workspace ? workspace.plan ?? "" : "").toLowerCase();
    const plan = rawPlan === "pro" || rawPlan === "guest" || rawPlan === "funder" || rawPlan === "enterprise" ? rawPlan : "starter";
    const quota = getRemainingQuota({
      ...workspace,
      plan,
      storage_used_bytes: workspace && "storage_used_bytes" in workspace ? workspace.storage_used_bytes : 0,
      briefings_count: workspace && "briefings_count" in workspace ? workspace.briefings_count : 0,
      pdf_exports_month: workspace && "pdf_exports_month" in workspace ? workspace.pdf_exports_month : 0,
      pdf_exports_reset_at: workspace && "pdf_exports_reset_at" in workspace ? workspace.pdf_exports_reset_at : null
    });
    const hasMembership = Boolean(membership?.workspace_id);

    ctx.info("resolved me", {
      userId,
      hasMembership,
      membershipRole: membership?.role ?? null,
      membershipWorkspaceId: membership?.workspace_id ?? null,
      hasWorkspace: Boolean(workspace),
      hasPlan: Boolean(workspace && "plan" in workspace ? workspace.plan : null),
      onboardingStep: profile?.onboarding_step ?? null
    });

    return NextResponse.json({
      user: {
        id: userId,
        email: email ?? "",
        full_name: profile?.full_name ?? null,
        avatar_path: profile?.avatar_path ?? null,
        initials: getInitials(profile?.full_name || email || "User", "US")
      },
      plan,
      subscription_name: workspace && "subscription_name" in workspace ? workspace.subscription_name ?? null : null,
      subscription_status: workspace && "subscription_status" in workspace ? workspace.subscription_status ?? null : null,
      stripe_price_id: workspace && "stripe_price_id" in workspace ? workspace.stripe_price_id ?? null : null,
      current_period_end: workspace && "current_period_end" in workspace ? workspace.current_period_end ?? null : null,
      usage: {
        pdf_exports_used: Number(workspace && "pdf_exports_month" in workspace ? workspace.pdf_exports_month : 0),
        pdf_exports_limit: quota.pdf_month,
        pdf_exports_remaining: quota.pdf_month
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

export async function PATCH(request: Request) {
  const ctx = createRequestContext("PATCH /api/me");

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
    return NextResponse.json({ data });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
