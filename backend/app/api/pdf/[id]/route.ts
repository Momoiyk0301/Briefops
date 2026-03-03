import { NextResponse } from "next/server";
import { z } from "zod";

import { renderBriefingPdf } from "@/pdf/renderBriefingPdf";
import { getBriefingById } from "@/supabase/queries/briefings";
import { listModules } from "@/supabase/queries/modules";
import { consumePdfExport, getCurrentMonthUsage } from "@/supabase/queries/usage";
import { requireUser } from "@/supabase/server";
import { createRequestContext, toErrorResponse } from "@/http";

const idSchema = z.string().uuid();

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = createRequestContext("GET /api/pdf/:id");

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    const briefingId = idSchema.parse(id);

    const briefing = await getBriefingById(client, briefingId);
    const modules = await listModules(client, briefingId);

    const usageResult = await consumePdfExport(client, userId, 3);
    if (!usageResult.allowed) {
      const usage = await getCurrentMonthUsage(client, userId);
      ctx.warn("pdf limit reached", { userId, used: usage?.pdf_exports ?? usageResult.used });
      return NextResponse.json(
        {
          error: "Monthly PDF export limit reached for free plan",
          used: usage?.pdf_exports ?? usageResult.used,
          limit: 3,
          request_id: ctx.requestId
        },
        { status: 402 }
      );
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
