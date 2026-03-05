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
const PDF_LIMITS: Record<"free" | "starter" | "plus" | "pro", number> = {
  free: 3,
  starter: 100,
  plus: 300,
  pro: Number.POSITIVE_INFINITY
};

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = createRequestContext("GET /api/pdf/:id");

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    const briefingId = idSchema.parse(id);

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
      }))
    });

    ctx.info("generated pdf", { userId, briefingId });

    const pdfArrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const storagePath = `${userId}/${briefing.id}/${Date.now()}-briefing.pdf`;

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
        const { error: persistError } = await client
          .from("briefings")
          .update({ pdf_path: storagePath })
          .eq("id", briefing.id);
        if (persistError) {
          ctx.warn("failed to persist pdf_path", { userId, briefingId, error: persistError.message });
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
