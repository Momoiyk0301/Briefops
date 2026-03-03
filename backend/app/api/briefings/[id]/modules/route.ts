import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteModule, listModules, upsertModule } from "@/supabase/queries/modules";
import { requireUser } from "@/supabase/server";

const upsertSchema = z.object({
  module_key: z.string().min(1),
  enabled: z.boolean().optional(),
  data_json: z.record(z.any()).default({})
});

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { client } = await requireUser(request);
    const { id } = await params;
    const modules = await listModules(client, id);
    return NextResponse.json({ data: modules });
  } catch (error) {
    const message = (error as Error).message;
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { client } = await requireUser(request);
    const { id } = await params;
    const body = await request.json();
    const input = upsertSchema.parse(body);
    const mod = await upsertModule(client, id, input);
    return NextResponse.json({ data: mod });
  } catch (error) {
    const message = (error as Error).message;
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { client } = await requireUser(request);
    const { id } = await params;
    const moduleKey = request.headers.get("x-module-key");

    if (!moduleKey) {
      return NextResponse.json({ error: "Missing x-module-key header" }, { status: 400 });
    }

    await deleteModule(client, id, moduleKey);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = (error as Error).message;
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
