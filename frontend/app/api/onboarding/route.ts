import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { createServiceRoleClient, requireAuthContext } from "@/supabase/server";

const updateStepSchema = z.object({
  onboarding_step: z.enum(["workspace", "products", "demo", "done"])
});

const createWorkspaceSchema = z
  .object({
    workspace_name: z.string().trim().min(2).max(120).optional(),
    org_name: z.string().trim().min(2).max(120).optional(),
    country: z.string().trim().min(2).max(120).optional(),
    team_size: z.number().int().positive().max(100000).nullable().optional(),
    vat_number: z.string().trim().max(64).nullable().optional()
  })
  .refine((value) => Boolean(value.workspace_name ?? value.org_name), {
    message: "workspace_name is required"
  });

type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

function resolveWorkspacePayload(input: CreateWorkspaceInput) {
  return {
    name: input.workspace_name ?? input.org_name ?? "",
    country: input.country ?? "Belgium",
    team_size: input.team_size ?? null,
    vat_number: input.vat_number ?? null
  };
}

export async function POST(request: Request) {
  const ctx = createRequestContext("POST /api/onboarding");

  try {
    const { client, userId, email } = await requireAuthContext(request);
    const rawBody = await request.json();

    if (rawBody && typeof rawBody === "object" && "onboarding_step" in rawBody) {
      const payload = updateStepSchema.parse(rawBody);
      const admin = createServiceRoleClient();
      const { error } = await admin
        .from("profiles")
        .update({ onboarding_step: payload.onboarding_step })
        .eq("id", userId);
      if (error) throw error;

      ctx.info("updated onboarding step", { userId, step: payload.onboarding_step });
      return NextResponse.json({ ok: true, onboarding_step: payload.onboarding_step });
    }

    const payload = createWorkspaceSchema.parse(rawBody);

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

    const workspacePayload = resolveWorkspacePayload(payload);
    const { data: workspace, error: workspaceError } = await admin
      .from("workspaces")
      .insert({
        owner_id: userId,
        name: workspacePayload.name,
        country: workspacePayload.country,
        team_size: workspacePayload.team_size,
        vat_number: workspacePayload.vat_number
      })
      .select("id,name,country,team_size,vat_number")
      .single();

    if (workspaceError) throw workspaceError;

    const { error: membershipError } = await admin.from("memberships").insert({
      org_id: workspace.id,
      user_id: userId,
      role: "owner"
    });

    if (membershipError) throw membershipError;

    const { error: profileUpdateError } = await admin
      .from("profiles")
      .update({ onboarding_step: "products" })
      .eq("id", userId);
    if (profileUpdateError) throw profileUpdateError;

    ctx.info("workspace created from onboarding", { userId, workspaceId: workspace.id });

    return NextResponse.json({ ok: true, workspace, onboarding_step: "products" }, { status: 201 });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
