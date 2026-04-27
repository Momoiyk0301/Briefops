import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteBriefing, getBriefingById, updateBriefing } from "@/supabase/queries/briefings";
import { getUserWorkspaceId } from "@/supabase/queries/modulesRegistry";
import { requireUser } from "@/supabase/server";
import { createRequestContext, HttpError, toErrorResponse } from "@/http";

const idSchema = z.string().uuid();

const updateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  status: z.enum(["draft", "ready", "archived"]).optional(),
  event_date: z.string().date().nullable().optional(),
  location_text: z.string().trim().nullable().optional()
});

type Params = { params: Promise<{ id: string }> };

async function assertBriefingAccess(client: Awaited<ReturnType<typeof requireUser>>["client"], userId: string, briefingId: string) {
  const [briefing, workspaceId] = await Promise.all([
    getBriefingById(client, briefingId),
    getUserWorkspaceId(client, userId)
  ]);
  if (!workspaceId || briefing.workspace_id !== workspaceId) {
    throw new HttpError(403, "Forbidden", "SUPABASE_RLS_DENIED");
  }
  return briefing;
}

export async function GET(request: Request, { params }: Params) {
  const ctx = createRequestContext("GET /api/briefings/:id", request);

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    const briefingId = idSchema.parse(id);
    const briefing = await assertBriefingAccess(client, userId, briefingId);
    ctx.info("fetched briefing", { userId, briefingId: id });
    return NextResponse.json({ data: briefing });
  } catch (error) {
    ctx.captureException("failed to fetch briefing", error, {
      origin: "server",
      step: "get-briefing",
      area: "supabase",
      action: "read",
      errorCode: error instanceof HttpError ? error.code : "BRIEFING_LOAD_FAILED"
    });
    return toErrorResponse(error, ctx.requestId, {
      area: "supabase",
      action: "read",
      errorCode: error instanceof HttpError ? error.code : "BRIEFING_LOAD_FAILED",
      route: "GET /api/briefings/:id"
    });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const ctx = createRequestContext("PATCH /api/briefings/:id", request);

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    const briefingId = idSchema.parse(id);
    await assertBriefingAccess(client, userId, briefingId);
    const patch = updateSchema.parse(await request.json());
    const briefing = await updateBriefing(client, briefingId, patch);
    ctx.info("updated briefing", { userId, briefingId: id });
    return NextResponse.json({ data: briefing });
  } catch (error) {
    ctx.captureException("failed to update briefing", error, {
      origin: "server",
      step: "patch-briefing",
      area: "supabase",
      action: "update",
      errorCode: error instanceof HttpError ? error.code : "BRIEFING_UPDATE_FAILED"
    });
    return toErrorResponse(error, ctx.requestId, {
      area: "supabase",
      action: "update",
      errorCode: error instanceof HttpError ? error.code : "BRIEFING_UPDATE_FAILED",
      route: "PATCH /api/briefings/:id"
    });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const ctx = createRequestContext("DELETE /api/briefings/:id", request);

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    const briefingId = idSchema.parse(id);
    await assertBriefingAccess(client, userId, briefingId);
    await deleteBriefing(client, briefingId);
    ctx.info("deleted briefing", { userId, briefingId: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    ctx.captureException("failed to delete briefing", error, {
      origin: "server",
      step: "delete-briefing",
      area: "supabase",
      action: "delete",
      errorCode: error instanceof HttpError ? error.code : "BRIEFING_DELETE_FAILED"
    });
    return toErrorResponse(error, ctx.requestId, {
      area: "supabase",
      action: "delete",
      errorCode: error instanceof HttpError ? error.code : "BRIEFING_DELETE_FAILED",
      route: "DELETE /api/briefings/:id"
    });
  }
}
