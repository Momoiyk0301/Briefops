import { NextResponse } from "next/server";

import { createRequestContext, toErrorResponse } from "@/http";
import { createServiceRoleClient, requireUser } from "@/supabase/server";
import { getUserWorkspaceId } from "@/supabase/queries/modulesRegistry";
import { listBriefingExportsByWorkspace } from "@/supabase/queries/briefingExports";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const ctx = createRequestContext("GET /api/briefing-exports");

  try {
    const { client, userId } = await requireUser(request);
    const workspaceId = await getUserWorkspaceId(client, userId);
    if (!workspaceId) {
      return NextResponse.json({ data: [] });
    }

    const service = createServiceRoleClient();
    const exportsList = await listBriefingExportsByWorkspace(service, workspaceId);

    return NextResponse.json({
      data: exportsList.map((item) => {
        const briefing = Array.isArray(item.briefings) ? item.briefings[0] : item.briefings;
        return {
          id: item.id,
          workspace_id: item.workspace_id,
          briefing_id: item.briefing_id,
          version: item.version,
          file_path: item.file_path,
          status: item.status,
          error_message: item.error_message ?? null,
          created_at: item.created_at,
          created_by: item.created_by,
          briefing_title: briefing?.title ?? "Untitled briefing",
          briefing_event_date: briefing?.event_date ?? null,
          briefing_location_text: briefing?.location_text ?? null
        };
      })
    });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
