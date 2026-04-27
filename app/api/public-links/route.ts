import { NextResponse } from "next/server";

import { env } from "@/env";
import { createRequestContext, toErrorResponse } from "@/http";
import { buildAudienceBriefingUrl, buildStaffBriefingUrl } from "@/lib/publicLinkRoutes";
import { listPublicLinksForCreator } from "@/supabase/queries/publicLinks";
import { createServiceRoleClient, requireUser } from "@/supabase/server";

export const runtime = "nodejs";

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
          url:
            link.link_type === "audience" && link.audience_tag
              ? buildAudienceBriefingUrl(baseUrl, link.briefing_id, link.audience_tag, link.token)
              : buildStaffBriefingUrl(baseUrl, link.token),
          briefing_title: briefing?.title ?? "Untitled briefing",
          pdf_path: briefing?.pdf_path ?? null
        };
      })
    );

    return NextResponse.json({ data: withBriefing });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId, {
      area: "public_share",
      action: "read",
      errorCode: "PUBLIC_SHARE_LOAD_FAILED",
      route: "GET /api/public-links"
    });
  }
}
