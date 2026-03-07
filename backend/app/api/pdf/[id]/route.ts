import { NextResponse } from "next/server";
import { z } from "zod";

import { renderBriefingPdf } from "@/pdf/renderBriefingPdf";
import { getBriefingById } from "@/supabase/queries/briefings";
import { listModules } from "@/supabase/queries/modules";
import { getUserPlan } from "@/supabase/queries/profiles";
import { consumePdfExport, getCurrentMonthUsage } from "@/supabase/queries/usage";
import { createServiceRoleClient, requireUser } from "@/supabase/server";
import { createRequestContext, toErrorResponse } from "@/http";

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
    const { id } = await params;
    const briefingId = idSchema.parse(id);
    const requestUrl = new URL(request.url);
    const format = formatSchema.parse(requestUrl.searchParams.get("format") ?? "binary");
    const selectedTeam = normalizeTeamKey(teamSchema.parse(requestUrl.searchParams.get("team") ?? undefined));

    const briefing = await getBriefingById(client, briefingId);
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
      modules: modules.map((mod) => ({
        module_key: mod.module_key,
        enabled: mod.enabled,
        data_json: mod.data_json as Record<string, unknown>
      })).filter((mod) => isModuleVisibleForTeam(mod, selectedTeam))
    });

    ctx.info("generated pdf", { userId, briefingId });

    const pdfArrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const storagePath = selectedTeam
      ? `${userId}/${briefing.id}/team-${selectedTeam}.pdf`
      : `${userId}/${briefing.id}/${Date.now()}-briefing.pdf`;

    try {
      const service = createServiceRoleClient();
      const { error: uploadError } = await service.storage
        .from("exports")
        .upload(storagePath, bytes, {
          contentType: "application/pdf",
          upsert: true
        });
      if (uploadError) {
        ctx.warn("storage upload failed", { userId, briefingId, bucket: "exports", error: uploadError.message });
      } else {
        if (!selectedTeam) {
          const { error: persistError } = await client
            .from("briefings")
            .update({ pdf_path: storagePath })
            .eq("id", briefing.id);
          if (persistError) {
            ctx.warn("failed to persist pdf_path", { userId, briefingId, error: persistError.message });
          }
        }
        ctx.info("storage upload success", { userId, briefingId, bucket: "exports", path: storagePath });
      }
    } catch (storageError) {
      ctx.warn("storage upload crashed", {
        userId,
        briefingId,
        bucket: "exports",
        error: storageError instanceof Error ? storageError.message : String(storageError)
      });
    }

    if (format === "json") {
      const service = createServiceRoleClient();
      const { data: signed, error: signedError } = await service.storage.from("exports").createSignedUrl(storagePath, 3600);
      if (signedError) {
        throw new HttpError(500, `Signed URL failed: ${signedError.message}`);
      }
      return NextResponse.json({
        ok: true,
        pdf_path: storagePath,
        pdf_url: signed.signedUrl,
        generated_at: new Date().toISOString(),
        team: selectedTeam
      });
    }

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
