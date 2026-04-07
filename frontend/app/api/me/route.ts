import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, toErrorResponse } from "@/http";
import { getInitials } from "@/lib/branding";
import { getRemainingQuota } from "@/lib/quotas";
import { requireAuthContext } from "@/supabase/server";

const patchSchema = z.object({
  avatar_path: z.string().trim().min(1).nullable().optional()
});

type WorkspaceSnapshot = {
  id: string;
  name: string;
  storage_used_bytes: number | null;
  briefings_count: number | null;
  pdf_exports_month: number | null;
  pdf_exports_reset_at: string | null;
  logo_path: string | null;
  initials: string | null;
  due_at: string | null;
  plan: string | null;
  stripe_price_id: string | null;
  subscription_name: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
};

export async function GET(request: Request) {
  const ctx = createRequestContext("GET /api/me", request);

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

    let workspace: WorkspaceSnapshot | null = null;
    if (membership?.workspace_id) {
      const { data: resolvedWorkspace, error: organizationError } = await client
        .from("workspaces")
        .select("id,name,storage_used_bytes,briefings_count,pdf_exports_month,pdf_exports_reset_at,logo_path,initials,due_at,plan,stripe_price_id,subscription_name,subscription_status,current_period_end")
        .eq("id", membership.workspace_id)
        .maybeSingle();

      if (organizationError) throw organizationError;
      workspace = resolvedWorkspace ?? null;
    }

    const rawPlan = String(workspace?.plan ?? "").toLowerCase();
    const plan = rawPlan === "pro" || rawPlan === "guest" || rawPlan === "funder" || rawPlan === "enterprise" ? rawPlan : "starter";
    const quota = getRemainingQuota({
      ...workspace,
      plan,
      storage_used_bytes: workspace?.storage_used_bytes ?? 0,
      briefings_count: workspace?.briefings_count ?? 0,
      pdf_exports_month: workspace?.pdf_exports_month ?? 0,
      pdf_exports_reset_at: workspace?.pdf_exports_reset_at ?? null
    });
    const hasMembership = Boolean(membership?.workspace_id);

    ctx.info("resolved me", {
      userId,
      hasMembership,
      membershipRole: membership?.role ?? null,
      membershipWorkspaceId: membership?.workspace_id ?? null,
      hasWorkspace: Boolean(workspace),
      hasPlan: Boolean(workspace?.plan ?? null),
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
      subscription_name: workspace?.subscription_name ?? null,
      subscription_status: workspace?.subscription_status ?? null,
      stripe_price_id: workspace?.stripe_price_id ?? null,
      current_period_end: workspace?.current_period_end ?? null,
      usage: {
        pdf_exports_used: Number(workspace?.pdf_exports_month ?? 0),
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
    ctx.captureException("failed to resolve me", error, {
      origin: "server",
      step: "load-me"
    });
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
