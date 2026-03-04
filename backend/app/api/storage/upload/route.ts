import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { createServiceRoleClient, requireUser } from "@/supabase/server";

export const runtime = "nodejs";

const bucketSchema = z.enum(["logos", "assets", "exports"]);

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  const ctx = createRequestContext("POST /api/storage/upload");

  try {
    const { userId } = await requireUser(request);
    const formData = await request.formData();
    const bucket = bucketSchema.parse(String(formData.get("bucket") ?? ""));
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new HttpError(400, "Missing file");
    }

    const fileName = sanitizeFileName(file.name || "upload.bin");
    const path = `${userId}/${Date.now()}-${fileName}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const service = createServiceRoleClient();
    const { error } = await service.storage.from(bucket).upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: true
    });
    if (error) throw error;

    ctx.info("uploaded file", { userId, bucket, path });
    return NextResponse.json({ bucket, path });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
