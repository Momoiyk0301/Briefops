import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { createServiceRoleClient, requireAuthContext } from "@/supabase/server";

const bodySchema = z.object({
  org_name: z.string().trim().min(2).max(120)
});

export async function POST(request: Request) {
  const ctx = createRequestContext("POST /api/onboarding");

  try {
    const { client, userId, email } = await requireAuthContext(request);
    const payload = bodySchema.parse(await request.json());

    const { data: existingMembership, error: existingMembershipError } = await client
      .from("memberships")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingMembershipError) throw existingMembershipError;
    if (existingMembership) {
      throw new HttpError(409, "User already has an organization");
    }

    const admin = createServiceRoleClient();

    if (email) {
      const { error: profileError } = await admin.from("profiles").upsert(
        {
          id: userId,
          email: email.toLowerCase()
        },
        { onConflict: "id" }
      );

      if (profileError) throw profileError;
    }

    const { data: organization, error: organizationError } = await admin
      .from("organizations")
      .insert({
        owner_id: userId,
        name: payload.org_name
      })
      .select("id,name")
      .single();

    if (organizationError) throw organizationError;

    const { error: membershipError } = await admin.from("memberships").insert({
      org_id: organization.id,
      user_id: userId,
      role: "owner"
    });

    if (membershipError) throw membershipError;

    ctx.info("onboarding completed", { userId, orgId: organization.id });

    return NextResponse.json({ ok: true, org: organization }, { status: 201 });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
