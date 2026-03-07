import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { ensureRegistryModules, getUserOrgId, updateRegistryModuleEnabled } from "@/supabase/queries/modulesRegistry";
import { requireUser } from "@/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z.object({
  id: z.string().uuid(),
  enabled: z.boolean()
});

export async function GET(request: Request) {
  const ctx = createRequestContext("GET /api/modules");

  try {
    const { client, userId } = await requireUser(request);
    const orgId = await getUserOrgId(client, userId);
    if (!orgId) throw new HttpError(404, "Workspace not found");

    const data = await ensureRegistryModules(client, orgId);
    return NextResponse.json({ data });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}

export async function PUT(request: Request) {
  const ctx = createRequestContext("PUT /api/modules");

  try {
    const { client, userId } = await requireUser(request);
    const orgId = await getUserOrgId(client, userId);
    if (!orgId) throw new HttpError(404, "Workspace not found");

    const input = updateSchema.parse(await request.json());
    const data = await updateRegistryModuleEnabled(client, orgId, input.id, input.enabled);
    return NextResponse.json({ data });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
