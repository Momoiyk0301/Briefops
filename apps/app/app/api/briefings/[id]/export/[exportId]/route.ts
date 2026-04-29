import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { getBriefingById } from "@/supabase/queries/briefings";
import { getBriefingExportById } from "@/supabase/queries/briefingExports";
import { getUserWorkspaceId } from "@/supabase/queries/modulesRegistry";
import { createServiceRoleClient, requireUser } from "@/supabase/server";

export const runtime = "nodejs";

const idSchema = z.string().uuid();

type Params = { params: Promise<{ id: string; exportId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = createRequestContext("GET /api/briefings/:id/export/:exportId");

  try {
    const { client, userId } = await requireUser(request);
    const { id, exportId } = await params;
    const briefingId = idSchema.parse(id);
    const normalizedExportId = idSchema.parse(exportId);

    const [briefing, workspaceId] = await Promise.all([
      getBriefingById(client, briefingId),
      getUserWorkspaceId(client, userId)
    ]);

    if (!workspaceId || briefing.workspace_id !== workspaceId) {
      throw new HttpError(403, "Forbidden");
    }

    const service = createServiceRoleClient();
    const exportRow = await getBriefingExportById(service, normalizedExportId);
    if (!exportRow || exportRow.workspace_id !== workspaceId || exportRow.briefing_id !== briefingId) {
      throw new HttpError(404, "Export not found");
    }

    return NextResponse.json({
      export_id: exportRow.id,
      version: exportRow.version,
      status: exportRow.status,
      file_path: exportRow.file_path,
      error_message: exportRow.error_message ?? null
    });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
