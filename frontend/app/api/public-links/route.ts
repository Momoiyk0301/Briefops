import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/env";
import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { createPublicLink } from "@/supabase/queries/publicLinks";
import { requireUser } from "@/supabase/server";

export const runtime = "nodejs";

const bodySchema = z.object({
  briefingId: z.string().uuid(),
  expiresAt: z.string().datetime().nullable().optional()
});

export async function POST(request: Request) {
  const ctx = createRequestContext("POST /api/public-links");

  try {
    const { client, userId } = await requireUser(request);
    const body = bodySchema.parse(await request.json());

    const { data: briefing, error: briefingError } = await client
      .from("briefings")
      .select("id, created_by")
      .eq("id", body.briefingId)
      .maybeSingle();

    if (briefingError) throw briefingError;
    if (!briefing) throw new HttpError(404, "Briefing not found");
    if (briefing.created_by !== userId) throw new HttpError(403, "Forbidden");

    const link = await createPublicLink(client, body.briefingId, userId, body.expiresAt ?? null);
    const baseUrl = env.APP_URL.replace(/\/$/, "");

    return NextResponse.json(
      {
        token: link.token,
        shareUrl: `${baseUrl}/share/${link.token}`
      },
      { status: 201 }
    );
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
