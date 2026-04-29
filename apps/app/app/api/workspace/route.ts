import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { requireUser } from "@/supabase/server";
import { getWorkspaceForUser } from "@/supabase/queries/workspaces";

const patchSchema = z.object({
  logo_path: z.string().trim().min(1).nullable().optional()
});

export async function PATCH(request: Request) {
  const ctx = createRequestContext("PATCH /api/workspace");

  try {
    const { client, userId } = await requireUser(request);
    const workspace = await getWorkspaceForUser(client, userId);
    if (!workspace) {
      throw new HttpError(404, "Workspace not found");
    }

    const payload = patchSchema.parse(await request.json());
    const { data, error } = await client
      .from("workspaces")
      .update({ logo_path: payload.logo_path ?? null })
      .eq("id", workspace.id)
      .select("id,logo_path")
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
