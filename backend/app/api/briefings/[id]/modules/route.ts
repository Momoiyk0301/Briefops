import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteModule, listModules, upsertModule } from "@/supabase/queries/modules";
import { requireUser } from "@/supabase/server";
import { createRequestContext, HttpError, toErrorResponse } from "@/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

const upsertSchema = z.object({
  module_key: z.string().trim().min(1),
  enabled: z.boolean().optional(),
  data_json: z.record(z.unknown()).default({})
});

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = createRequestContext("GET /api/briefings/:id/modules");

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    const modules = await listModules(client, idSchema.parse(id));
    ctx.info("listed modules", { userId, briefingId: id, count: modules.length });
    return NextResponse.json({ data: modules });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}

export async function PUT(request: Request, { params }: Params) {
  const ctx = createRequestContext("PUT /api/briefings/:id/modules");

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    const input = upsertSchema.parse(await request.json());
    const mod = await upsertModule(client, idSchema.parse(id), input);
    ctx.info("upserted module", { userId, briefingId: id, moduleKey: input.module_key });
    return NextResponse.json({ data: mod });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const ctx = createRequestContext("DELETE /api/briefings/:id/modules");

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    const moduleKey = request.headers.get("x-module-key");

    if (!moduleKey) {
      throw new HttpError(400, "Missing x-module-key header");
    }

    await deleteModule(client, idSchema.parse(id), moduleKey);
    ctx.info("deleted module", { userId, briefingId: id, moduleKey });
    return NextResponse.json({ ok: true });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
