import { NextResponse } from "next/server";
import { z } from "zod";

import { renderBriefingPdf } from "@/pdf/renderBriefingPdf";
import { getBriefingById } from "@/supabase/queries/briefings";
import { createBriefingExport, getNextBriefingExportVersion } from "@/supabase/queries/briefingExports";
import { listModules } from "@/supabase/queries/modules";
import { getUserWorkspaceId } from "@/supabase/queries/modulesRegistry";
import { getUserPlan } from "@/supabase/queries/profiles";
import { createServiceRoleClient, requireUser } from "@/supabase/server";
import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { buildBriefingPdfFilename } from "@/lib/pdfFilename";
import { enforceRateLimit, resolveRateLimitKey } from "@/server/rateLimit";
import { checkQuota, getPlanLimits } from "@/lib/quotas";
import { getWorkspaceById } from "@/supabase/queries/workspaces";

export const runtime = "nodejs";
export const maxDuration = 60;

const idSchema = z.string().uuid();
const formatSchema = z.enum(["binary", "json"]);
const teamSchema = z.string().trim().min(1).max(64).optional();

type Params = { params: Promise<{ id: string }> };

function normalizeTeamKey(team?: string | null) {
  if (!team) return null;
  const normalized = team
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || null;
}

function isModuleVisibleForTeam(
  moduleRow: { enabled: boolean; data_json: unknown },
  selectedTeam: string | null
) {
  if (!moduleRow.enabled) return false;
  if (!moduleRow.data_json || typeof moduleRow.data_json !== "object" || Array.isArray(moduleRow.data_json)) return true;

  const raw = moduleRow.data_json as {
    metadata?: { enabled?: boolean };
    audience?: { mode?: string; teams?: string[]; visibility?: string };
  };
  const metadataEnabled = raw.metadata?.enabled !== false;
  const visibilityEnabled = raw.audience?.visibility !== "hidden";
  if (!metadataEnabled || !visibilityEnabled) return false;
  if (!selectedTeam) return true;
  if (raw.audience?.mode !== "teams") return true;

  const teams = Array.isArray(raw.audience?.teams) ? raw.audience?.teams : [];
  return teams.some((team) => normalizeTeamKey(team) === selectedTeam);
}

export async function GET(request: Request, { params }: Params) {
  const ctx = createRequestContext("GET /api/pdf/:id");

  try {
    const { client, userId } = await requireUser(request);
    const rateLimit = enforceRateLimit(resolveRateLimitKey(request, "pdf", userId), 12, 60_000);
    if (!rateLimit.allowed) {
      throw new HttpError(429, "Too many PDF generations. Please wait a minute.");
    }
    const { id } = await params;
    const briefingId = idSchema.parse(id);
    const requestUrl = new URL(request.url);
    const format = formatSchema.parse(requestUrl.searchParams.get("format") ?? "binary");
    const selectedTeam = normalizeTeamKey(teamSchema.parse(requestUrl.searchParams.get("team") ?? undefined));

    const [briefing, workspaceId] = await Promise.all([
      getBriefingById(client, briefingId),
      getUserWorkspaceId(client, userId)
    ]);
    if (!workspaceId || briefing.workspace_id !== workspaceId) {
      throw new HttpError(403, "Forbidden");
    }
    const modules = await listModules(client, briefingId);

    const plan = await getUserPlan(client, userId);
    const workspace = await getWorkspaceById(client, workspaceId);
    const quota = checkQuota({ ...workspace, plan }, "export_pdf");
    if (!quota.allowed) {
      ctx.warn("pdf limit reached", { userId, plan, used: quota.current, limit: quota.limit });
      return NextResponse.json(
        {
          error: quota.message ?? `Monthly PDF export limit reached for ${plan} plan`,
          used: quota.current,
          limit: quota.limit,
          request_id: ctx.requestId
        },
        { status: 402 }
      );
    }

    const service = createServiceRoleClient();

    // Generate PDF first — quota is only consumed after a successful upload
    const bytes = await renderBriefingPdf({
      id: briefing.id,
      title: briefing.title,
      event_date: briefing.event_date,
      location_text: briefing.location_text,
      team: selectedTeam,
      watermark: getPlanLimits(plan).watermark,
      modules: modules.map((mod) => ({
        module_key: mod.module_key,
        enabled: mod.enabled,
        data_json: mod.data_json
      })).filter((mod) => isModuleVisibleForTeam(mod, selectedTeam))
    });

    const version = await getNextBriefingExportVersion(service, briefing.id);
    const storagePath = `briefings/${briefing.id}/exports/v${version}.pdf`;
    const filename = buildBriefingPdfFilename({
      title: briefing.title,
      eventDate: briefing.event_date,
      team: selectedTeam,
      version
    });

    const { error: uploadError } = await service.storage
      .from("exports")
      .upload(storagePath, bytes, {
        contentType: "application/pdf",
        upsert: false
      });

    if (uploadError) {
      throw new HttpError(500, `Storage upload failed: ${uploadError.message}`);
    }

    // Increment quota only after generation and upload both succeeded
    const { error: quotaUpdateError } = await service
      .from("workspaces")
      .update({
        pdf_exports_month: Number(quota.org.pdf_exports_month ?? workspace.pdf_exports_month ?? 0) + 1,
        pdf_exports_reset_at: quota.org.pdf_exports_reset_at
      })
      .eq("id", workspace.id);

    if (quotaUpdateError) {
      throw new HttpError(500, `Failed to update PDF quota: ${quotaUpdateError.message}`);
    }

    const exportRow = await createBriefingExport(service, {
      workspace_id: briefing.workspace_id,
      briefing_id: briefing.id,
      version,
      file_path: storagePath,
      created_by: userId
    });

    if (!selectedTeam) {
      const { error: persistError } = await client
        .from("briefings")
        .update({ pdf_path: storagePath })
        .eq("id", briefing.id);

      if (persistError) {
        throw new HttpError(500, `Failed to persist pdf_path: ${persistError.message}`);
      }
    }

    const { data: signed, error: signedError } = await service.storage
      .from("exports")
      .createSignedUrl(storagePath, 3600);

    if (signedError) {
      throw new HttpError(500, `Signed URL failed: ${signedError.message}`);
    }

    ctx.info("generated and uploaded pdf", { userId, briefingId, storagePath });

    if (format === "json") {
      return NextResponse.json({
        ok: true,
        export_id: exportRow.id,
        version,
        pdf_path: storagePath,
        pdf_url: signed.signedUrl,
        generated_at: new Date().toISOString(),
        team: selectedTeam,
        filename
      });
    }

    const pdfArrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    return new NextResponse(pdfArrayBuffer, {
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
