import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { isImageFile } from "@/lib/branding";
import { checkQuota } from "@/lib/quotas";
import { getUserPlan } from "@/supabase/queries/profiles";
import { getWorkspaceForUser } from "@/supabase/queries/workspaces";
import { createServiceRoleClient, requireUser } from "@/supabase/server";

export const runtime = "nodejs";

const bucketSchema = z.enum(["logos", "avatars", "assets", "exports"]);
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  const ctx = createRequestContext("POST /api/storage/upload");

  try {
    const { client, userId } = await requireUser(request);
    const formData = await request.formData();
    const bucket = bucketSchema.parse(String(formData.get("bucket") ?? ""));
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new HttpError(400, "Missing file");
    }
    if ((bucket === "logos" || bucket === "avatars") && !isImageFile(file)) {
      throw new HttpError(400, "Only image uploads are allowed for avatars and logos.");
    }
    if ((bucket === "logos" || bucket === "avatars") && file.size > MAX_IMAGE_BYTES) {
      throw new HttpError(400, "Image is too large. Maximum size is 2 MB.");
    }

    const [plan, workspace] = await Promise.all([getUserPlan(client, userId), getWorkspaceForUser(client, userId)]);
    if (!workspace) {
      throw new HttpError(404, "Workspace not found");
    }

    const quota = checkQuota({ ...workspace, plan }, "upload", file.size);
    if (!quota.allowed) {
      throw new HttpError(402, quota.message ?? "Storage limit reached for this workspace.");
    }

    const fileName = sanitizeFileName(file.name || "upload.bin");
    const folder = bucket === "logos" ? `workspace/${workspace.id}` : bucket === "avatars" ? `user/${userId}` : userId;
    const path = `${folder}/${Date.now()}-${fileName}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const service = createServiceRoleClient();
    const { error } = await service.storage.from(bucket).upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: true
    });
    if (error) throw error;

    const { error: workspaceUpdateError } = await service
      .from("workspaces")
      .update({
        storage_used_bytes: Number(quota.org.storage_used_bytes ?? workspace.storage_used_bytes ?? 0) + file.size,
        pdf_exports_reset_at: quota.org.pdf_exports_reset_at
      })
      .eq("id", workspace.id);

    if (workspaceUpdateError) {
      throw new HttpError(500, `Failed to update workspace storage usage: ${workspaceUpdateError.message}`);
    }

    ctx.info("uploaded file", { userId, bucket, path });
    return NextResponse.json({ bucket, path });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
