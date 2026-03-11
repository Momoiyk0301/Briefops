import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { env } from "@/env";
import { syncBriefingSharedState } from "@/supabase/queries/briefings";
import { createPublicLink, listPublicLinks, revokePublicLink } from "@/supabase/queries/publicLinks";
import { createServiceRoleClient, requireUser } from "@/supabase/server";
import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { enforceRateLimit, resolveRateLimitKey } from "@/server/rateLimit";

const idSchema = z.string().uuid();
const durationSchema = z.enum(["24h", "3d", "1w", "30d", "never"]);
const createShareSchema = z.object({
  duration: durationSchema,
  type: z.enum(["staff", "audience"]).default("staff"),
  tag: z.string().trim().min(1).max(64).nullable().optional()
});
const deleteShareSchema = z.object({ link_id: z.string().uuid() });

type Params = { params: Promise<{ id: string }> };

async function assertCanManagePublicLinks(briefingId: string, userId: string, client: SupabaseClient) {
  const { data: briefing, error: briefingError } = await client
    .from("briefings")
    .select("workspace_id")
    .eq("id", briefingId)
    .single();

  if (briefingError || !briefing) {
    throw new HttpError(404, "Briefing not found");
  }

  const { data: membership, error: membershipError } = await client
    .from("memberships")
    .select("role")
    .eq("workspace_id", briefing.workspace_id)
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

function normalizeTag(team?: string | null) {
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
        url:
          link.link_type === "audience" && link.audience_tag
            ? `${baseUrl}/briefings/${briefingId}/${link.audience_tag}/${link.token}`
            : `${baseUrl}/briefings/s/${link.token}`
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
    const rateLimit = enforceRateLimit(resolveRateLimitKey(request, "share:create", userId), 20, 60_000);
    if (!rateLimit.allowed) {
      throw new HttpError(429, "Too many share link requests. Please wait a minute.");
    }
    const { id } = await params;
    const briefingId = idSchema.parse(id);
    await assertCanManagePublicLinks(briefingId, userId, client);

    const admin = createServiceRoleClient();
    const body = createShareSchema.parse(await request.json());

    const normalizedTag = normalizeTag(body.tag ?? null);
    if (body.type === "audience" && !normalizedTag) {
      throw new HttpError(400, "Audience tag is required");
    }

    const link = await createPublicLink(admin, briefingId, userId, resolveExpiration(body.duration), body.type, normalizedTag);
    await syncBriefingSharedState(admin, briefingId);
    const baseUrl = env.APP_URL.replace(/\/$/, "");

    return NextResponse.json(
      {
        data: {
          ...link,
          url:
            link.link_type === "audience" && link.audience_tag
              ? `${baseUrl}/briefings/${briefingId}/${link.audience_tag}/${link.token}`
              : `${baseUrl}/briefings/s/${link.token}`
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
    await syncBriefingSharedState(admin, briefingId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
