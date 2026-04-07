import { NextResponse } from "next/server";
import { z } from "zod";

import { countBriefingsByOrg, createBriefing, listBriefings } from "@/supabase/queries/briefings";
import { getUserOrgId } from "@/supabase/queries/modulesRegistry";
import { getUserPlan } from "@/supabase/queries/profiles";
import { requireUser } from "@/supabase/server";
import { createRequestContext, HttpError, toErrorResponse } from "@/http";

const createSchema = z.object({
  org_id: z.string().uuid(),
  title: z.string().trim().min(1),
  event_date: z.string().date().optional(),
  location_text: z.string().trim().optional()
});
const BRIEFING_LIMITS: Record<"free" | "starter" | "plus" | "pro", number> = {
  free: 1,
  starter: 20,
  plus: 100,
  pro: Number.POSITIVE_INFINITY
};

export async function GET(request: Request) {
  const ctx = createRequestContext("GET /api/briefings", request);

  try {
    const { client, userId } = await requireUser(request);
    const briefings = await listBriefings(client);
    ctx.info("listed briefings", { userId, count: briefings.length });
    return NextResponse.json({ data: briefings });
  } catch (error) {
    ctx.captureException("failed to list briefings", error, {
      origin: "server",
      step: "list-briefings"
    });
    return toErrorResponse(error, ctx.requestId);
  }
}

export async function POST(request: Request) {
  const ctx = createRequestContext("POST /api/briefings", request);

  try {
    const { client, userId } = await requireUser(request);
    const body = createSchema.parse(await request.json());
    const orgId = await getUserOrgId(client, userId);
    if (!orgId || orgId !== body.org_id) {
      throw new HttpError(403, "Forbidden");
    }
    const plan = await getUserPlan(client, userId);
    const limit = BRIEFING_LIMITS[plan];
    if (Number.isFinite(limit)) {
      const count = await countBriefingsByOrg(client, orgId);
      if (count >= limit) {
        throw new HttpError(402, `Briefing limit reached for ${plan} plan (${limit})`);
      }
    }
    const briefing = await createBriefing(client, userId, body);
    ctx.info("created briefing", { userId, briefingId: briefing.id });
    return NextResponse.json({ data: briefing }, { status: 201 });
  } catch (error) {
    ctx.captureException("failed to create briefing", error, {
      origin: "server",
      step: "create-briefing"
    });
    return toErrorResponse(error, ctx.requestId);
  }
}
