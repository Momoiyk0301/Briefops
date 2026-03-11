import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { renderBriefingPdf } from "@/pdf/renderBriefingPdf";
import { getBriefingById } from "@/supabase/queries/briefings";
import { getBriefingExportById, updateBriefingExport } from "@/supabase/queries/briefingExports";
import { listModules } from "@/supabase/queries/modules";
import { getUserWorkspaceId } from "@/supabase/queries/modulesRegistry";
import { getUserPlan } from "@/supabase/queries/profiles";
import { consumePdfExport, getCurrentMonthUsage } from "@/supabase/queries/usage";
import { createServiceRoleClient, requireUser } from "@/supabase/server";

export const runtime = "nodejs";

const idSchema = z.string().uuid();

const PDF_LIMITS: Record<"free" | "starter" | "plus" | "pro", number> = {
  free: 3,
  starter: 100,
  plus: 300,
  pro: Number.POSITIVE_INFINITY
};

type Params = { params: Promise<{ id: string; exportId: string }> };

export async function POST(request: Request, { params }: Params) {
  const ctx = createRequestContext("POST /api/briefings/:id/export/:exportId/generate");

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

    if (exportRow.status === "ready") {
      return NextResponse.json({
        export_id: exportRow.id,
        version: exportRow.version,
        status: exportRow.status,
        file_path: exportRow.file_path
      });
    }

    const plan = await getUserPlan(client, userId);
    const limit = PDF_LIMITS[plan];
    if (Number.isFinite(limit)) {
      const usageResult = await consumePdfExport(client, userId, limit);
      if (!usageResult.allowed) {
        const usage = await getCurrentMonthUsage(client, userId);
        throw new HttpError(402, `Monthly PDF export limit reached for ${plan} plan (${usage?.pdf_exports ?? usageResult.used}/${limit})`);
      }
    }

    await updateBriefingExport(service, normalizedExportId, {
      status: "generating",
      error_message: null
    });

    try {
      const modules = await listModules(client, briefingId);
      const bytes = await renderBriefingPdf({
        id: briefing.id,
        title: briefing.title,
        event_date: briefing.event_date,
        location_text: briefing.location_text,
        modules: modules.map((mod) => ({
          module_key: mod.module_key,
          enabled: mod.enabled,
          data_json: mod.data_json
        }))
      });

      const { error: uploadError } = await service.storage
        .from("exports")
        .upload(exportRow.file_path, bytes, {
          contentType: "application/pdf",
          upsert: false
        });

      if (uploadError) {
        throw new HttpError(500, `Storage upload failed: ${uploadError.message}`);
      }

      await updateBriefingExport(service, normalizedExportId, {
        status: "ready",
        error_message: null
      });

      const { error: persistError } = await client
        .from("briefings")
        .update({ pdf_path: exportRow.file_path })
        .eq("id", briefing.id);

      if (persistError) {
        throw new HttpError(500, `Failed to persist pdf_path: ${persistError.message}`);
      }

      return NextResponse.json({
        export_id: exportRow.id,
        version: exportRow.version,
        status: "ready",
        file_path: exportRow.file_path
      });
    } catch (error) {
      await updateBriefingExport(service, normalizedExportId, {
        status: "failed",
        error_message: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
