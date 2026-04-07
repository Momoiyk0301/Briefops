import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, toErrorResponse } from "@/http";
import { createServiceRoleClient, requireUser } from "@/supabase/server";

export const runtime = "nodejs";

const querySchema = z.object({
  bucket: z.enum(["logos", "avatars", "assets", "exports"]),
  path: z.string().min(1),
  expires_in: z.coerce.number().int().min(60).max(86400).default(3600)
});

export async function GET(request: Request) {
  const ctx = createRequestContext("GET /api/storage/signed-url");

  try {
    await requireUser(request);
    const url = new URL(request.url);
    const params = querySchema.parse({
      bucket: url.searchParams.get("bucket"),
      path: url.searchParams.get("path"),
      expires_in: url.searchParams.get("expires_in") ?? "3600"
    });

    const service = createServiceRoleClient();
    const { data, error } = await service.storage
      .from(params.bucket)
      .createSignedUrl(params.path, params.expires_in);
    if (error) throw error;

    return NextResponse.json({ url: data.signedUrl });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
