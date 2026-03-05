import { NextResponse } from "next/server";
import { z } from "zod";

import { getBriefingByPublicToken } from "@/supabase/queries/publicLinks";
import { createPublicTokenClient } from "@/supabase/server";
import { createRequestContext, toErrorResponse } from "@/http";

const tokenSchema = z.string().min(10);

type Params = { params: Promise<{ token: string }> };

export async function GET(_: Request, { params }: Params) {
  const ctx = createRequestContext("GET /api/public/:token");

  try {
    const { token } = await params;
    const publicToken = tokenSchema.parse(token);
    const client = createPublicTokenClient(publicToken);
    const data = await getBriefingByPublicToken(client, publicToken);
    return NextResponse.json({ data });
  } catch (error) {
    return toErrorResponse(error, ctx.requestId);
  }
}
