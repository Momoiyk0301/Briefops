import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { renderBriefingPdf } from "@/pdf/renderBriefingPdf";
import { getBriefingById } from "@/supabase/queries/briefings";
import { getBriefingExportById, updateBriefingExport } from "@/supabase/queries/briefingExports";
import { listModules } from "@/supabase/queries/modules";
import { getUserWorkspaceId } from "@/supabase/queries/modulesRegistry";
import { getUserPlan } from "@/supabase/queries/profiles";
import { createServiceRoleClient, requireUser } from "@/supabase/server";
import { checkQuota, getPlanLimits } from "@/lib/quotas";
import { getWorkspaceById } from "@/supabase/queries/workspaces";

export const runtime = "nodejs";

const idSchema = z.string().uuid();

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
      throw new HttpError(403, "Forbidden", "SUPABASE_RLS_DENIED");
    }

    const service = createServiceRoleClient();
    const exportRow = await getBriefingExportById(service, normalizedExportId);
    if (!exportRow || exportRow.workspace_id !== workspaceId || exportRow.briefing_id !== briefingId) {
      throw new HttpError(404, "Export not found", "SUPABASE_NOT_FOUND");
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
    const workspace = await getWorkspaceById(client, workspaceId);
    const quota = checkQuota({ ...workspace, plan }, "export_pdf");
    if (!quota.allowed) {
      throw new HttpError(402, quota.message ?? `Monthly PDF export limit reached for ${plan} plan`, "PDF_EXPORT_FAILED");
    }

    const { error: quotaUpdateError } = await service
      .from("workspaces")
      .update({
        pdf_exports_month: Number(quota.org.pdf_exports_month ?? workspace.pdf_exports_month ?? 0) + 1,
        pdf_exports_reset_at: quota.org.pdf_exports_reset_at
      })
      .eq("id", workspace.id);

    if (quotaUpdateError) {
      throw new HttpError(500, `Failed to update PDF quota: ${quotaUpdateError.message}`, "PDF_EXPORT_DB_FAILED");
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
        watermark: getPlanLimits(plan).watermark,
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
        throw new HttpError(500, `Storage upload failed: ${uploadError.message}`, "PDF_STORAGE_UPLOAD_FAILED");
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
        throw new HttpError(500, `Failed to persist pdf_path: ${persistError.message}`, "PDF_EXPORT_DB_FAILED");
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
    return toErrorResponse(error, ctx.requestId, {
      area: "pdf",
      action: "export",
      errorCode: error instanceof HttpError ? error.code : "PDF_EXPORT_FAILED",
      severity: "high",
      route: "POST /api/briefings/:id/export/:exportId/generate"
    });
  }
}
