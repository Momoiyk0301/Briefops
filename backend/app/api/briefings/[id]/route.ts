import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteBriefing, getBriefingById, updateBriefing } from "@/supabase/queries/briefings";
import { requireUser } from "@/supabase/server";
import { createRequestContext, toErrorResponse } from "@/http";

const idSchema = z.string().uuid();

const updateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  event_date: z.string().date().nullable().optional(),
  location_text: z.string().trim().nullable().optional()
});

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = createRequestContext("GET /api/briefings/:id");

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    const briefing = await getBriefingById(client, idSchema.parse(id));
    ctx.info("fetched briefing", { userId, briefingId: id });
    return NextResponse.json({ data: briefing });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const ctx = createRequestContext("PATCH /api/briefings/:id");

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    const patch = updateSchema.parse(await request.json());
    const briefing = await updateBriefing(client, idSchema.parse(id), patch);
    ctx.info("updated briefing", { userId, briefingId: id });
    return NextResponse.json({ data: briefing });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const ctx = createRequestContext("DELETE /api/briefings/:id");

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    await deleteBriefing(client, idSchema.parse(id));
    ctx.info("deleted briefing", { userId, briefingId: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
