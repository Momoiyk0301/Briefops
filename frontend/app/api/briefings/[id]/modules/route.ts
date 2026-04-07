import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteModule, listModules, upsertModule } from "@/supabase/queries/modules";
import { getUserWorkspaceId, listWorkspaceModules } from "@/supabase/queries/modulesRegistry";
import { requireUser } from "@/supabase/server";
import { createRequestContext, HttpError, toErrorResponse } from "@/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

const upsertSchema = z.object({
  module_id: z.string().uuid().nullable().optional(),
  module_key: z.string().trim().min(1),
  enabled: z.boolean().optional(),
  data_json: z.union([z.record(z.unknown()), z.array(z.unknown())]).default({})
});

const DEFAULT_AUDIENCE = {
  mode: "all",
  teams: [],
  visibility: "visible"
} as const;

const DEFAULT_LAYOUT = {
  desktop: { x: 0, y: 0, w: 12, h: 3 },
  mobile: { x: 0, y: 0, w: 12, h: 4 },
  constraints: { minW: 3, minH: 2, maxW: 12, maxH: 8 },
  behavior: { draggable: true, resizable: true },
  style: { variant: "default", shape: "card", density: "comfortable" }
} as const;

type Params = { params: Promise<{ id: string }> };

function nowIso() {
  return new Date().toISOString();
}

function isCanonical(data: unknown): data is { metadata: unknown; audience: unknown; layout: unknown; data: unknown } {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const value = data as Record<string, unknown>;
  return "metadata" in value && "audience" in value && "layout" in value && "data" in value;
}

function buildCanonicalModuleJson(module: {
  id: string;
  name: string;
  type: string;
  version: number;
  icon: string;
  category: string;
  enabled: boolean;
  default_layout: unknown;
  default_data: unknown;
}) {
  const timestamp = nowIso();
  return {
    id: `${module.type}_${module.version}`,
    metadata: {
      type: module.type,
      label: module.name,
      version: module.version,
      enabled: module.enabled,
      order: 0,
      description: module.name,
      icon: module.icon,
      category: module.category,
      created_at: timestamp,
      updated_at: timestamp
    },
    audience: DEFAULT_AUDIENCE,
    layout: (module.default_layout && typeof module.default_layout === "object") ? module.default_layout : DEFAULT_LAYOUT,
    data: (module.default_data && typeof module.default_data === "object") ? module.default_data : {}
  };
}

async function ensureBriefingModulesAreSeeded(client: Awaited<ReturnType<typeof requireUser>>["client"], userId: string, briefingId: string) {
  const workspaceId = await getUserWorkspaceId(client, userId);
  if (!workspaceId) throw new HttpError(404, "Workspace not found");

  const registry = await listWorkspaceModules(client, workspaceId);
  const existing = await listModules(client, briefingId);
  const byKey = new Map(existing.map((item) => [item.module_key, item]));

  await Promise.all(
    registry.map(async (module) => {
      const current = byKey.get(module.type);
      if (!current) {
        await upsertModule(client, briefingId, {
          module_id: module.id,
          module_key: module.type,
          enabled: module.enabled,
          data_json: buildCanonicalModuleJson(module)
        });
        return;
      }

      if (!current.module_id) {
        await upsertModule(client, briefingId, {
          module_id: module.id,
          module_key: module.type,
          enabled: current.enabled,
          data_json: isCanonical(current.data_json)
            ? current.data_json
            : {
                ...buildCanonicalModuleJson(module),
                data: current.data_json
              }
        });
      }
    })
  );

  return listModules(client, briefingId);
}

export async function GET(request: Request, { params }: Params) {
  const ctx = createRequestContext("GET /api/briefings/:id/modules");

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    const briefingId = idSchema.parse(id);
    const modules = await ensureBriefingModulesAreSeeded(client, userId, briefingId);
    ctx.info("listed modules", { userId, briefingId: id, count: modules.length });
    return NextResponse.json({ data: modules });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}

export async function PUT(request: Request, { params }: Params) {
  const ctx = createRequestContext("PUT /api/briefings/:id/modules");

  try {
    const { client } = await requireUser(request);
    const { id } = await params;
    const input = upsertSchema.parse(await request.json());
    const mod = await upsertModule(client, idSchema.parse(id), input);
    ctx.info("upserted module");
    return NextResponse.json({ data: mod });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const ctx = createRequestContext("DELETE /api/briefings/:id/modules");

  try {
    const { client, userId } = await requireUser(request);
    const { id } = await params;
    const moduleKey = request.headers.get("x-module-key");

    if (!moduleKey) {
      throw new HttpError(400, "Missing x-module-key header");
    }

    await deleteModule(client, idSchema.parse(id), moduleKey);
    ctx.info("deleted module", { userId, briefingId: id, moduleKey });
    return NextResponse.json({ ok: true });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
