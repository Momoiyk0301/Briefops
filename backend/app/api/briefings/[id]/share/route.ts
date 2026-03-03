import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { env } from "@/env";
import { createPublicLink, listPublicLinks } from "@/supabase/queries/publicLinks";
import { createServiceRoleClient, requireUser } from "@/supabase/server";
import { createRequestContext, HttpError, toErrorResponse } from "@/http";

const idSchema = z.string().uuid();
const createShareSchema = z.object({
  expires_at: z.string().datetime().nullable().optional()
});

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

export async function GET(request: Request, { params }: Params) {
  const ctx = createRequestContext("GET /api/briefings/:id/share");

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    const briefingId = idSchema.parse(id);
    await assertCanManagePublicLinks(briefingId, userId, client);

    const admin = createServiceRoleClient();
    const links = await listPublicLinks(admin, briefingId);

    return NextResponse.json({
      data: links.map((link) => ({
        ...link,
        url: `${env.APP_URL}/api/public/${link.token}`
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
    const link = await createPublicLink(admin, briefingId, body.expires_at ?? null);

    return NextResponse.json(
      {
        data: {
          ...link,
          url: `${env.APP_URL}/api/public/${link.token}`
        }
      },
      { status: 201 }
    );
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
