import { NextResponse } from "next/server";
import { z } from "zod";

import { countBriefingsByWorkspace, createBriefing, listBriefings } from "@/supabase/queries/briefings";
import { getUserWorkspaceId } from "@/supabase/queries/modulesRegistry";
import { getUserPlan } from "@/supabase/queries/profiles";
import { createServiceRoleClient, requireUser } from "@/supabase/server";
import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { checkQuota } from "@/lib/quotas";
import { getWorkspaceById } from "@/supabase/queries/workspaces";

const createSchema = z.object({
  workspace_id: z.string().uuid(),
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
    const workspaceId = await getUserWorkspaceId(client, userId);
    if (!workspaceId || workspaceId !== body.workspace_id) {
      throw new HttpError(403, "Forbidden");
    }
    const plan = await getUserPlan(client, userId);
    const workspace = await getWorkspaceById(client, workspaceId);
    const quota = checkQuota({ ...workspace, plan }, "create_briefing");
    if (!quota.allowed) {
      throw new HttpError(402, quota.message ?? "Briefing limit reached for this plan.");
    }
    const briefing = await createBriefing(client, userId, body);
    const service = createServiceRoleClient();
    const nextCount = Math.max(Number(quota.org.briefings_count ?? workspace.briefings_count ?? 0) + 1, await countBriefingsByWorkspace(client, workspaceId));
    const { error: workspaceUpdateError } = await service
      .from("workspaces")
      .update({ briefings_count: nextCount })
      .eq("id", workspaceId);

    if (workspaceUpdateError) throw workspaceUpdateError;
    ctx.info("created briefing", { userId, briefingId: briefing.id });
    return NextResponse.json({ data: briefing }, { status: 201 });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
