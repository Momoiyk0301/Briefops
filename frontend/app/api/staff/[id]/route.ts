import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { deleteStaff, getStaffById, updateStaff } from "@/supabase/queries/staff";
import { requireUser } from "@/supabase/server";

export const runtime = "nodejs";

const idSchema = z.string().uuid();
const patchSchema = z.object({
  full_name: z.string().trim().min(1).optional(),
  role: z.string().trim().min(1).optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  notes: z.string().trim().optional()
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const ctx = createRequestContext("PATCH /api/staff/:id");

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    const body = patchSchema.parse(await request.json());
    const staffId = idSchema.parse(id);

    const { data: membership, error: membershipError } = await client
      .from("memberships")
      .select("workspace_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership?.workspace_id) throw new HttpError(404, "Workspace not found");

    const existing = await getStaffById(client, staffId);
    if (!existing) throw new HttpError(404, "Staff not found");
    if (!existing.org_id || existing.org_id !== membership.workspace_id) throw new HttpError(403, "Forbidden");

    const data = await updateStaff(client, staffId, body);
    if (!data.org_id || data.org_id !== membership.workspace_id) throw new HttpError(500, "Invalid staff workspace");
    return NextResponse.json({ data });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const ctx = createRequestContext("DELETE /api/staff/:id");

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    const staffId = idSchema.parse(id);

    const { data: membership, error: membershipError } = await client
      .from("memberships")
      .select("workspace_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership?.workspace_id) throw new HttpError(404, "Workspace not found");

    const existing = await getStaffById(client, staffId);
    if (!existing) throw new HttpError(404, "Staff not found");
    if (!existing.org_id || existing.org_id !== membership.workspace_id) throw new HttpError(403, "Forbidden");

    await deleteStaff(client, staffId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
