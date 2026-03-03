import { NextResponse } from "next/server";

import { renderBriefingPdf } from "@/pdf/renderBriefingPdf";
import { getBriefingById } from "@/supabase/queries/briefings";
import { listModules } from "@/supabase/queries/modules";
import { consumePdfExport, getCurrentMonthUsage } from "@/supabase/queries/usage";
import { requireUser } from "@/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;

    const briefing = await getBriefingById(client, id);
    const modules = await listModules(client, id);

    const usageResult = await consumePdfExport(client, userId, 3);
    if (!usageResult.allowed) {
      const usage = await getCurrentMonthUsage(client, userId);
      return NextResponse.json(
        {
          error: "Monthly PDF export limit reached for free plan",
          used: usage?.pdf_exports ?? usageResult.used,
          limit: 3
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

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="briefing-${briefing.id}.pdf"`
      }
    });
  } catch (error) {
    const message = (error as Error).message;
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
