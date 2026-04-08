import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { getInitials } from "@/lib/branding";
import { createServiceRoleClient, requireAuthContext } from "@/supabase/server";

const updateStepSchema = z.object({
  onboarding_step: z.enum(["workspace", "products", "demo", "done"])
});

const createWorkspaceSchema = z
  .object({
    workspace_name: z.string().min(2).max(120).optional(),
    country: z.string().min(2).max(120).optional(),
    team_size: z.number().int().positive().max(100000).nullable().optional(),
    vat_number: z.string().max(64).nullable().optional()
  })
  .refine((value) => Boolean(value.workspace_name), {
    message: "workspace_name is required"
  });

type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

function resolveWorkspacePayload(input: CreateWorkspaceInput) {
  return {
    name: input.workspace_name ?? "",
    initials: getInitials(input.workspace_name ?? "", "WS"),
    country: input.country ?? "Belgium",
    team_size: input.team_size ?? null,
    vat_number: input.vat_number ?? null
  };
}

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

function normalizeCreateWorkspaceBody(rawBody: unknown) {
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
  const ctx = createRequestContext("POST /api/onboarding", request);

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

    const payload = createWorkspaceSchema.parse(normalizeCreateWorkspaceBody(rawBody));

    const { data: existingMembership, error: existingMembershipError } = await client
      .from("memberships")
      .select("id,workspace_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingMembershipError) throw existingMembershipError;
    if (existingMembership) {
      const admin = createServiceRoleClient();
      const { data: existingWorkspace, error: existingWorkspaceError } = await admin
        .from("workspaces")
        .select("id,name,country,team_size,vat_number")
        .eq("id", existingMembership.workspace_id)
        .maybeSingle();

      if (existingWorkspaceError) throw existingWorkspaceError;

      const { error: profileUpdateError } = await admin
        .from("profiles")
        .update({ onboarding_step: "products" })
        .eq("id", userId);
      if (profileUpdateError) throw profileUpdateError;

      ctx.warn("workspace creation skipped because membership already exists", {
        userId,
        workspaceId: existingMembership.workspace_id
      });

      return NextResponse.json(
        {
          ok: true,
          workspace: existingWorkspace ?? null,
          onboarding_step: "products",
          reused_existing_workspace: true
        },
        { status: 200 }
      );
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
        initials: workspacePayload.initials,
        country: workspacePayload.country,
        team_size: workspacePayload.team_size,
        vat_number: workspacePayload.vat_number
      })
      .select("id,name,country,team_size,vat_number")
      .single();

    if (workspaceError) throw workspaceError;

    const { error: membershipError } = await admin.from("memberships").insert({
      workspace_id: workspace.id,
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
    ctx.captureException("failed onboarding action", error, {
      origin: "server",
      step: "onboarding"
    });
    return toErrorResponse(error, ctx.requestId);
  }
}
