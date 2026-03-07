import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/env";
import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { createPublicLink, listPublicLinksForCreator } from "@/supabase/queries/publicLinks";
import { createServiceRoleClient, requireUser } from "@/supabase/server";

export const runtime = "nodejs";

const durationSchema = z.enum(["24h", "3d", "1w", "30d", "never"]);
const bodySchema = z.object({
  briefingId: z.string().uuid(),
  duration: durationSchema.optional(),
  expiresAt: z.string().datetime().nullable().optional()
});

function resolveExpiration(duration?: z.infer<typeof durationSchema>, legacyExpiresAt?: string | null) {
  if (legacyExpiresAt) return legacyExpiresAt;
  if (!duration || duration === "never") return null;

  const now = new Date();
  const expiresAt = new Date(now);
  if (duration === "24h") expiresAt.setHours(expiresAt.getHours() + 24);
  if (duration === "3d") expiresAt.setDate(expiresAt.getDate() + 3);
  if (duration === "1w") expiresAt.setDate(expiresAt.getDate() + 7);
  if (duration === "30d") expiresAt.setDate(expiresAt.getDate() + 30);
  return expiresAt.toISOString();
}

export async function GET(request: Request) {
  const ctx = createRequestContext("GET /api/public-links");

  try {
    const { userId } = await requireUser(request);
    const admin = createServiceRoleClient();
    const links = await listPublicLinksForCreator(admin, userId);
    const baseUrl = env.APP_URL.replace(/\/$/, "");

    const withBriefing = await Promise.all(
      links.map(async (link) => {
        const { data: briefing } = await admin
          .from("briefings")
          .select("id, title, pdf_path")
          .eq("id", link.briefing_id)
          .maybeSingle();

        return {
          ...link,
          url: `${baseUrl}/share/${link.token}`,
          briefing_title: briefing?.title ?? "Untitled briefing",
          pdf_path: briefing?.pdf_path ?? null
        };
      })
    );

    return NextResponse.json({ data: withBriefing });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}

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

    const link = await createPublicLink(
      client,
      body.briefingId,
      userId,
      resolveExpiration(body.duration, body.expiresAt ?? null)
    );
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
