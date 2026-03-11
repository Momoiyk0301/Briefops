import { NextResponse } from "next/server";
import { z } from "zod";

import { renderBriefingPdf } from "@/pdf/renderBriefingPdf";
import { getBriefingById } from "@/supabase/queries/briefings";
import { listModules } from "@/supabase/queries/modules";
import { getUserOrgId } from "@/supabase/queries/modulesRegistry";
import { getUserPlan } from "@/supabase/queries/profiles";
import { consumePdfExport, getCurrentMonthUsage } from "@/supabase/queries/usage";
import { createServiceRoleClient, requireUser } from "@/supabase/server";
import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { enforceRateLimit, resolveRateLimitKey } from "@/server/rateLimit";

const idSchema = z.string().uuid();
const formatSchema = z.enum(["binary", "json"]);
const teamSchema = z.string().trim().min(1).max(64).optional();

const PDF_LIMITS: Record<"free" | "starter" | "plus" | "pro", number> = {
  free: 3,
  starter: 100,
  plus: 300,
  pro: Number.POSITIVE_INFINITY
};

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

    const [briefing, orgId] = await Promise.all([
      getBriefingById(client, briefingId),
      getUserOrgId(client, userId)
    ]);
    if (!orgId || briefing.org_id !== orgId) {
      throw new HttpError(403, "Forbidden");
    }
    const modules = await listModules(client, briefingId);

    const plan = await getUserPlan(client, userId);
    const limit = PDF_LIMITS[plan];
    if (Number.isFinite(limit)) {
      const usageResult = await consumePdfExport(client, userId, limit);
      if (!usageResult.allowed) {
        const usage = await getCurrentMonthUsage(client, userId);
        ctx.warn("pdf limit reached", { userId, plan, used: usage?.pdf_exports ?? usageResult.used, limit });
        return NextResponse.json(
          {
            error: `Monthly PDF export limit reached for ${plan} plan`,
            used: usage?.pdf_exports ?? usageResult.used,
            limit,
            request_id: ctx.requestId
          },
          { status: 402 }
        );
      }
    }

    const bytes = await renderBriefingPdf({
      id: briefing.id,
      title: briefing.title,
      event_date: briefing.event_date,
      location_text: briefing.location_text,
      team: selectedTeam,
      modules: modules.map((mod) => ({
        module_key: mod.module_key,
        enabled: mod.enabled,
        data_json: mod.data_json
      })).filter((mod) => isModuleVisibleForTeam(mod, selectedTeam))
    });

    const service = createServiceRoleClient();
    const storagePath = selectedTeam
      ? `${userId}/${briefing.id}/team-${selectedTeam}.pdf`
      : `${userId}/${briefing.id}/briefing-${briefing.id}-${Date.now()}.pdf`;

    const { error: uploadError } = await service.storage
      .from("exports")
      .upload(storagePath, bytes, {
        contentType: "application/pdf",
        upsert: true
      });

    if (uploadError) {
      throw new HttpError(500, `Storage upload failed: ${uploadError.message}`);
    }

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
        pdf_path: storagePath,
        pdf_url: signed.signedUrl,
        generated_at: new Date().toISOString(),
        team: selectedTeam
      });
    }

    const pdfArrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    return new NextResponse(pdfArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="briefing-${briefing.id}.pdf"`
      }
    });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
