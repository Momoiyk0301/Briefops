import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { getUserWorkspaceId } from "@/supabase/queries/modulesRegistry";
import { createServiceRoleClient, requireUser } from "@/supabase/server";

export const runtime = "nodejs";

const querySchema = z.object({
  bucket: z.enum(["logos", "avatars", "assets", "exports"]),
  path: z.string().min(1).max(512),
  expires_in: z.coerce.number().int().min(60).max(86400).default(3600)
});

async function assertCanSignPath(input: {
  bucket: z.infer<typeof querySchema>["bucket"];
  path: string;
  service: ReturnType<typeof createServiceRoleClient>;
  userId: string;
  workspaceId: string | null;
}) {
  const { bucket, path, service, userId, workspaceId } = input;

  if (path.includes("..") || path.startsWith("/") || path.includes("\\")) {
    throw new HttpError(400, "Invalid storage path", "SUPABASE_RLS_DENIED");
  }

  if (bucket === "avatars") {
    if (path.startsWith(`user/${userId}/`)) return;
    throw new HttpError(403, "Forbidden", "SUPABASE_RLS_DENIED");
  }

  if (bucket === "logos") {
    if (workspaceId && path.startsWith(`workspace/${workspaceId}/`)) return;
    throw new HttpError(403, "Forbidden", "SUPABASE_RLS_DENIED");
  }

  if (bucket === "assets") {
    if (path.startsWith(`${userId}/`)) return;
    throw new HttpError(403, "Forbidden", "SUPABASE_RLS_DENIED");
  }

  if (!workspaceId) {
    throw new HttpError(403, "Forbidden", "SUPABASE_RLS_DENIED");
  }

  const { data: exportRow, error: exportError } = await service
    .from("briefing_exports")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("file_path", path)
    .maybeSingle();
  if (exportError) throw exportError;
  if (exportRow) return;

  const { data: briefingRow, error: briefingError } = await service
    .from("briefings")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("pdf_path", path)
    .maybeSingle();
  if (briefingError) throw briefingError;
  if (briefingRow) return;

  throw new HttpError(403, "Forbidden", "SUPABASE_RLS_DENIED");
}

export async function GET(request: Request) {
  const ctx = createRequestContext("GET /api/storage/signed-url");

  try {
    const { client, userId } = await requireUser(request);
    const url = new URL(request.url);
    const params = querySchema.parse({
      bucket: url.searchParams.get("bucket"),
      path: url.searchParams.get("path"),
      expires_in: url.searchParams.get("expires_in") ?? "3600"
    });

    const service = createServiceRoleClient();
    const workspaceId = await getUserWorkspaceId(client, userId);
    await assertCanSignPath({
      bucket: params.bucket,
      path: params.path,
      service,
      userId,
      workspaceId
    });

    const { data, error } = await service.storage
      .from(params.bucket)
      .createSignedUrl(params.path, params.expires_in);
    if (error) throw error;

    return NextResponse.json({ url: data.signedUrl });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId, {
      area: "storage",
      action: "read",
      errorCode: error instanceof HttpError ? error.code : "SUPABASE_QUERY_FAILED",
      severity: "medium",
      route: "GET /api/storage/signed-url"
    });
  }
}
