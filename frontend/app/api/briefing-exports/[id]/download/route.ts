import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { createServiceRoleClient, requireUser } from "@/supabase/server";
import { getUserWorkspaceId } from "@/supabase/queries/modulesRegistry";
import { getBriefingExportById } from "@/supabase/queries/briefingExports";

export const runtime = "nodejs";

const idSchema = z.string().uuid();

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = createRequestContext("GET /api/briefing-exports/:id/download");

  try {
    const { client, userId } = await requireUser(request);
    const workspaceId = await getUserWorkspaceId(client, userId);
    const { id } = await params;
    const exportId = idSchema.parse(id);

    if (!workspaceId) {
      throw new HttpError(403, "Forbidden");
    }

    const service = createServiceRoleClient();
    const exportRow = await getBriefingExportById(service, exportId);

    if (!exportRow || exportRow.workspace_id !== workspaceId) {
      throw new HttpError(404, "PDF export not found");
    }

    const { data, error } = await service.storage.from("exports").download(exportRow.file_path);
    if (error) {
      throw new HttpError(500, `Storage download failed: ${error.message}`);
    }

    const filename = `briefing-${exportRow.briefing_id}-v${exportRow.version}.pdf`;
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
