import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { PUBLIC_LINK_INVALID_MESSAGE, getActivePublicLinkWithPdfPath } from "@/supabase/queries/publicLinks";
import { createServiceRoleClient } from "@/supabase/server";

const tokenSchema = z.string().min(24).max(128);

type Params = { params: Promise<{ token: string }> };

export async function GET(_: Request, { params }: Params) {
  const ctx = createRequestContext("GET /api/public/:token");

  try {
    const { token } = await params;
    const publicToken = tokenSchema.parse(token);
    const service = createServiceRoleClient();
    const resolved = await getActivePublicLinkWithPdfPath(service, publicToken);

    if (!resolved) {
      throw new HttpError(410, PUBLIC_LINK_INVALID_MESSAGE);
    }

    const { data: signed, error: signedError } = await service.storage
      .from("exports")
      .createSignedUrl(resolved.pdfPath, 3600);
    if (signedError) throw new HttpError(500, `Signed URL failed: ${signedError.message}`);

    return NextResponse.json({
      pdf_url: signed.signedUrl,
      expires_at: resolved.expiresAt
    });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
