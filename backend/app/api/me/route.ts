import { NextResponse } from "next/server";

import { createRequestContext, toErrorResponse } from "@/http";
import { requireAuthContext } from "@/supabase/server";

export async function GET(request: Request) {
  const ctx = createRequestContext("GET /api/me");

  try {
    const { client, userId, email } = await requireAuthContext(request);

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("plan,subscription_name,subscription_status,stripe_price_id,current_period_end")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw profileError;

    const { data: membership, error: membershipError } = await client
      .from("memberships")
      .select("org_id,role")
      .eq("user_id", userId)
      .maybeSingle();

    if (membershipError) throw membershipError;

    let org: { id: string; name: string } | null = null;
    if (membership?.org_id) {
      const { data: organization, error: organizationError } = await client
        .from("organizations")
        .select("id,name")
        .eq("id", membership.org_id)
        .maybeSingle();

      if (organizationError) throw organizationError;
      org = organization ?? null;
    }

    ctx.info("resolved me", { userId, hasOrg: Boolean(org), hasPlan: Boolean(profile?.plan) });

    return NextResponse.json({
      user: { id: userId, email: email ?? "" },
      plan: profile?.plan ?? null,
      subscription_name: profile?.subscription_name ?? null,
      subscription_status: profile?.subscription_status ?? null,
      stripe_price_id: profile?.stripe_price_id ?? null,
      current_period_end: profile?.current_period_end ?? null,
      org,
      role: membership?.role ?? null,
      is_admin: membership?.role === "owner" || membership?.role === "admin"
    });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
