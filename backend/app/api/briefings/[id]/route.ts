import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteBriefing, getBriefingById, updateBriefing } from "@/supabase/queries/briefings";
import { requireUser } from "@/supabase/server";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  event_date: z.string().date().nullable().optional(),
  location_text: z.string().nullable().optional()
});

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { client } = await requireUser(request);
    const { id } = await params;
    const briefing = await getBriefingById(client, id);
    return NextResponse.json({ data: briefing });
  } catch (error) {
    const message = (error as Error).message;
    const status = message === "Unauthorized" ? 401 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { client } = await requireUser(request);
    const { id } = await params;
    const body = await request.json();
    const patch = updateSchema.parse(body);
    const briefing = await updateBriefing(client, id, patch);
    return NextResponse.json({ data: briefing });
  } catch (error) {
    const message = (error as Error).message;
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { client } = await requireUser(request);
    const { id } = await params;
    await deleteBriefing(client, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = (error as Error).message;
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
