import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { getActivePublicLinkWithPdfPath } from "@/supabase/queries/publicLinks";
import { createServiceRoleClient } from "@/supabase/server";

export const runtime = "nodejs";

const tokenSchema = z.string().uuid();
type Params = { params: Promise<{ token: string }> };

export async function GET(_: Request, { params }: Params) {
  const ctx = createRequestContext("GET /share/:token");

  try {
    const { token } = await params;
    const publicToken = tokenSchema.parse(token);
    const service = createServiceRoleClient();

    const link = await getActivePublicLinkWithPdfPath(service, publicToken);
    if (!link) throw new HttpError(404, "Link not found");

    const { data, error } = await service.storage.from("exports").createSignedUrl(link.pdfPath, 60);
    if (error || !data?.signedUrl) {
      throw new HttpError(404, "PDF not found");
    }

    return NextResponse.redirect(data.signedUrl, { status: 302 });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
