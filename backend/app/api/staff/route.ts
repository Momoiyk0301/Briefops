import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { createStaff, listStaffByOrg } from "@/supabase/queries/staff";
import { requireUser } from "@/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  briefing_id: z.string().uuid(),
  full_name: z.string().trim().min(1),
  role: z.string().trim().min(1).default("staff"),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  notes: z.string().trim().optional()
});

export async function GET(request: Request) {
  const ctx = createRequestContext("GET /api/staff");

  try {
    const { client, userId } = await requireUser(request);

    const { data: membership, error: membershipError } = await client
      .from("memberships")
      .select("workspace_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership?.workspace_id) throw new HttpError(404, "Workspace not found");

    const data = await listStaffByOrg(client, membership.workspace_id);
    return NextResponse.json({ data });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}

export async function POST(request: Request) {
  const ctx = createRequestContext("POST /api/staff");

  try {
    const { client, userId } = await requireUser(request);
    const body = createSchema.parse(await request.json());

    const { data: membership, error: membershipError } = await client
      .from("memberships")
      .select("workspace_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership?.workspace_id) throw new HttpError(404, "Workspace not found");

    const { data: briefing, error: briefingError } = await client
      .from("briefings")
      .select("id, org_id")
      .eq("id", body.briefing_id)
      .maybeSingle();

    if (briefingError) throw briefingError;
    if (!briefing) throw new HttpError(404, "Briefing not found");
    if (briefing.org_id !== membership.workspace_id) throw new HttpError(403, "Forbidden");

    const data = await createStaff(client, membership.workspace_id, body);
    if (!data.org_id || data.org_id !== membership.workspace_id) {
      throw new HttpError(500, "Invalid staff workspace");
    }
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
