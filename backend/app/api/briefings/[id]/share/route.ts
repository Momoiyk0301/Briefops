import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { env } from "@/env";
import { createPublicLink, listPublicLinks } from "@/supabase/queries/publicLinks";
import { createServiceRoleClient, requireUser } from "@/supabase/server";

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
    throw new Error("Briefing not found");
  }

  const { data: membership, error: membershipError } = await client
    .from("memberships")
    .select("role")
    .eq("org_id", briefing.org_id)
    .eq("user_id", userId)
    .in("role", ["owner", "admin"])
    .maybeSingle();

  if (membershipError || !membership) {
    throw new Error("Forbidden");
  }
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    await assertCanManagePublicLinks(id, userId, client);

    const admin = createServiceRoleClient();
    const links = await listPublicLinks(admin, id);
    return NextResponse.json({
      data: links.map((link) => ({
        ...link,
        url: `${env.APP_URL}/api/public/${link.token}`
      }))
    });
  } catch (error) {
    const message = (error as Error).message;
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    await assertCanManagePublicLinks(id, userId, client);

    const admin = createServiceRoleClient();
    const body = await request.json();
    const { expires_at } = createShareSchema.parse(body);

    const link = await createPublicLink(admin, id, expires_at ?? null);

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
    const message = (error as Error).message;
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
