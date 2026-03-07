import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { env } from "@/env";
import { createPublicLink, listPublicLinks, revokePublicLink } from "@/supabase/queries/publicLinks";
import { createServiceRoleClient, requireUser } from "@/supabase/server";
import { createRequestContext, HttpError, toErrorResponse } from "@/http";

const idSchema = z.string().uuid();
const durationSchema = z.enum(["24h", "3d", "1w", "30d", "never"]);
const createShareSchema = z.object({
  duration: durationSchema,
  team: z.string().trim().min(1).max(64).nullable().optional()
});
const deleteShareSchema = z.object({ link_id: z.string().uuid() });

type Params = { params: Promise<{ id: string }> };

async function assertCanManagePublicLinks(briefingId: string, userId: string, client: SupabaseClient) {
  const { data: briefing, error: briefingError } = await client
    .from("briefings")
    .select("org_id")
    .eq("id", briefingId)
    .single();

  if (briefingError || !briefing) {
    throw new HttpError(404, "Briefing not found");
  }

  const { data: membership, error: membershipError } = await client
    .from("memberships")
    .select("role")
    .eq("org_id", briefing.org_id)
    .eq("user_id", userId)
    .in("role", ["owner", "admin"])
    .maybeSingle();

  if (membershipError || !membership) {
    throw new HttpError(403, "Forbidden");
  }
}

function resolveExpiration(duration: z.infer<typeof durationSchema>) {
  const now = new Date();
  if (duration === "never") return null;

  const expiresAt = new Date(now);
  if (duration === "24h") expiresAt.setHours(expiresAt.getHours() + 24);
  if (duration === "3d") expiresAt.setDate(expiresAt.getDate() + 3);
  if (duration === "1w") expiresAt.setDate(expiresAt.getDate() + 7);
  if (duration === "30d") expiresAt.setDate(expiresAt.getDate() + 30);

  return expiresAt.toISOString();
}

function normalizeTeamKey(team?: string | null) {
  if (!team) return null;
  const normalized = team
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || null;
}

export async function GET(request: Request, { params }: Params) {
  const ctx = createRequestContext("GET /api/briefings/:id/share");

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    const briefingId = idSchema.parse(id);
    await assertCanManagePublicLinks(briefingId, userId, client);

    const admin = createServiceRoleClient();
    const links = await listPublicLinks(admin, briefingId);
    const baseUrl = env.APP_URL.replace(/\/$/, "");

    return NextResponse.json({
      data: links.map((link) => ({
        ...link,
        url: `${baseUrl}/share/${link.token}`
      }))
    });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}

export async function POST(request: Request, { params }: Params) {
  const ctx = createRequestContext("POST /api/briefings/:id/share");

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    const briefingId = idSchema.parse(id);
    await assertCanManagePublicLinks(briefingId, userId, client);

    const admin = createServiceRoleClient();
    const body = createShareSchema.parse(await request.json());
    const { data: briefing } = await admin
      .from("briefings")
      .select("id, created_by, pdf_path")
      .eq("id", briefingId)
      .maybeSingle();
    if (!briefing) {
      throw new HttpError(404, "Briefing not found");
    }

    const normalizedTeam = normalizeTeamKey(body.team ?? null);
    if (normalizedTeam) {
      const teamPdfPath = `${briefing.created_by}/${briefingId}/team-${normalizedTeam}.pdf`;
      const { error: teamPdfError } = await admin.storage
        .from("exports")
        .createSignedUrl(teamPdfPath, 60);
      if (teamPdfError) {
        throw new HttpError(409, `Generate team PDF first (${normalizedTeam})`);
      }
    } else if (!briefing.pdf_path) {
      throw new HttpError(409, "Generate a PDF before sharing");
    }

    const link = await createPublicLink(admin, briefingId, userId, resolveExpiration(body.duration), normalizedTeam);
    const baseUrl = env.APP_URL.replace(/\/$/, "");

    return NextResponse.json(
      {
        data: {
          ...link,
          url: `${baseUrl}/share/${link.token}`
        }
      },
      { status: 201 }
    );
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const ctx = createRequestContext("DELETE /api/briefings/:id/share");

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    const briefingId = idSchema.parse(id);
    await assertCanManagePublicLinks(briefingId, userId, client);

    const body = deleteShareSchema.parse(await request.json());
    const admin = createServiceRoleClient();
    const revoked = await revokePublicLink(admin, body.link_id, userId);
    if (!revoked || revoked.briefing_id !== briefingId) {
      throw new HttpError(404, "Share link not found");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
