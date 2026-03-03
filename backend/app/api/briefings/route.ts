import { NextResponse } from "next/server";
import { z } from "zod";

import { createBriefing, listBriefings } from "@/supabase/queries/briefings";
import { requireUser } from "@/supabase/server";
import { createRequestContext, toErrorResponse } from "@/http";

const createSchema = z.object({
  org_id: z.string().uuid(),
  title: z.string().trim().min(1),
  event_date: z.string().date().optional(),
  location_text: z.string().trim().optional()
});

export async function GET(request: Request) {
  const ctx = createRequestContext("GET /api/briefings");

  try {
    const { client, userId } = await requireUser(request);
    const briefings = await listBriefings(client);
    ctx.info("listed briefings", { userId, count: briefings.length });
    return NextResponse.json({ data: briefings });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}

export async function POST(request: Request) {
  const ctx = createRequestContext("POST /api/briefings");

  try {
    const { client, userId } = await requireUser(request);
    const body = createSchema.parse(await request.json());
    const briefing = await createBriefing(client, userId, body);
    ctx.info("created briefing", { userId, briefingId: briefing.id });
    return NextResponse.json({ data: briefing }, { status: 201 });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
