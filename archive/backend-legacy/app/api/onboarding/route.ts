import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { createServiceRoleClient, requireAuthContext } from "@/supabase/server";

const updateStepSchema = z.object({
  onboarding_step: z.enum(["workspace", "products", "demo", "done"])
});

const bodySchema = z
  .object({
    workspace_name: z.string().min(2).max(120).optional(),
    country: z.string().min(2).max(120).optional(),
    team_size: z.number().int().positive().max(100000).nullable().optional(),
    vat_number: z.string().max(64).nullable().optional()
  })
  .refine((value) => Boolean(value.workspace_name), {
    message: "workspace_name is required"
  });

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function normalizeNullableString(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeNullablePositiveInt(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : Number.NaN;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function normalizeBody(rawBody: unknown) {
  if (!rawBody || typeof rawBody !== "object") return rawBody;

  const body = rawBody as Record<string, unknown>;
  return {
    workspace_name: normalizeOptionalString(body.workspace_name),
    country: normalizeOptionalString(body.country),
    team_size: normalizeNullablePositiveInt(body.team_size),
    vat_number: normalizeNullableString(body.vat_number)
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

    const payload = bodySchema.parse(normalizeBody(rawBody));

    const { data: existingMembership, error: existingMembershipError } = await client
      .from("memberships")
      .select("id,workspace_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingMembershipError) throw existingMembershipError;
    if (existingMembership) {
      const admin = createServiceRoleClient();
      const { data: organization, error: organizationError } = await admin
        .from("workspaces")
        .update({
          name: payload.workspace_name,
          country: payload.country ?? "Belgium",
          team_size: payload.team_size ?? null,
          vat_number: payload.vat_number ?? null
        })
        .eq("id", existingMembership.workspace_id)
        .select("id,name,country,team_size,vat_number")
        .single();

      if (organizationError) throw organizationError;

      const { error: profileUpdateError } = await admin
        .from("profiles")
        .update({ onboarding_step: "products" })
        .eq("id", userId);

      if (profileUpdateError) throw profileUpdateError;

      ctx.info("workspace updated from onboarding", { userId, workspaceId: organization.id });
      return NextResponse.json({ ok: true, workspace: organization, onboarding_step: "products" });
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
      workspace_id: organization.id,
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
