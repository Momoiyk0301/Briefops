import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { getBriefingById } from "@/supabase/queries/briefings";
import { createBriefingExport, getNextBriefingExportVersion } from "@/supabase/queries/briefingExports";
import { getUserWorkspaceId } from "@/supabase/queries/modulesRegistry";
import { createServiceRoleClient, requireUser } from "@/supabase/server";

export const runtime = "nodejs";

const idSchema = z.string().uuid();

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const ctx = createRequestContext("POST /api/briefings/:id/export");

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    const briefingId = idSchema.parse(id);

    const [briefing, workspaceId] = await Promise.all([
      getBriefingById(client, briefingId),
      getUserWorkspaceId(client, userId)
    ]);

    if (!workspaceId || briefing.workspace_id !== workspaceId) {
      throw new HttpError(403, "Forbidden");
    }

    const service = createServiceRoleClient();
    const version = await getNextBriefingExportVersion(service, briefingId);
    const filePath = `briefings/${briefingId}/exports/v${version}.pdf`;
    const exportRow = await createBriefingExport(service, {
      workspace_id: workspaceId,
      briefing_id: briefingId,
      version,
      file_path: filePath,
      status: "creating",
      error_message: null,
      created_by: userId
    });

    ctx.info("created export job", { userId, briefingId, exportId: exportRow.id, version });
    return NextResponse.json({
      export_id: exportRow.id,
      version: exportRow.version,
      status: exportRow.status
    });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
