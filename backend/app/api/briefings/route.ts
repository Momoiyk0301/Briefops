import { NextResponse } from "next/server";
import { z } from "zod";

import { createBriefing, listBriefings } from "@/supabase/queries/briefings";
import { requireUser } from "@/supabase/server";

const createSchema = z.object({
  org_id: z.string().uuid(),
  title: z.string().min(1),
  event_date: z.string().date().optional(),
  location_text: z.string().optional()
});

export async function GET(request: Request) {
  try {
    const { client } = await requireUser(request);
    const briefings = await listBriefings(client);
    return NextResponse.json({ data: briefings });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { client, userId } = await requireUser(request);
    const body = await request.json();
    const input = createSchema.parse(body);
    const briefing = await createBriefing(client, userId, input);
    return NextResponse.json({ data: briefing }, { status: 201 });
  } catch (error) {
    const message = (error as Error).message;
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
