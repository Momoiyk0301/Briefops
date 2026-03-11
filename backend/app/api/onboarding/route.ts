import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { createServiceRoleClient, requireAuthContext } from "@/supabase/server";

const bodySchema = z.object({
  workspace_name: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2).max(120).optional(),
  team_size: z.number().int().positive().max(100000).nullable().optional(),
  vat_number: z.string().trim().max(64).nullable().optional()
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
      throw new HttpError(409, "User already has a workspace");
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
      .from("workspaces")
      .insert({
        owner_id: userId,
        name: payload.workspace_name,
        country: payload.country ?? "Belgium",
        team_size: payload.team_size ?? null,
        vat_number: payload.vat_number ?? null
      })
      .select("id,name,country,team_size,vat_number")
      .single();

    if (organizationError) throw organizationError;

    const { error: membershipError } = await admin.from("memberships").insert({
      org_id: organization.id,
      user_id: userId,
      role: "owner"
    });

    if (membershipError) throw membershipError;

    const { error: profileUpdateError } = await admin
      .from("profiles")
      .update({ onboarding_step: "products" })
      .eq("id", userId);

    if (profileUpdateError) throw profileUpdateError;

    ctx.info("workspace created from onboarding", { userId, workspaceId: organization.id });

    return NextResponse.json({ ok: true, workspace: organization, onboarding_step: "products" }, { status: 201 });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
