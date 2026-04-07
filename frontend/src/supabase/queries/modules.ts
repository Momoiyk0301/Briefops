import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const upsertModuleSchema = z.object({
  module_id: z.string().uuid().nullable().optional(),
  module_key: z.string().min(1),
  enabled: z.boolean().optional(),
  settings: z.record(z.any()).default({}),
  values: z.record(z.any()).default({}),
  data_json: z.record(z.any()).or(z.array(z.any())).default({})
});

export type UpsertModuleInput = z.infer<typeof upsertModuleSchema>;

export async function listModules(client: SupabaseClient, briefingId: string) {
  const { data, error } = await client
    .from("briefing_modules")
    .select("id, briefing_id, module_id, module_key, enabled, settings, values, data_json, created_at, updated_at")
    .eq("briefing_id", briefingId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function upsertModule(client: SupabaseClient, briefingId: string, input: UpsertModuleInput) {
  const payload = upsertModuleSchema.parse(input);

  const { data, error } = await client
    .from("briefing_modules")
    .upsert(
      {
        briefing_id: briefingId,
        module_id: payload.module_id ?? null,
        module_key: payload.module_key,
        enabled: payload.enabled ?? true,
        settings: payload.settings,
        values: payload.values,
        data_json: payload.data_json
      },
      { onConflict: "briefing_id,module_key" }
    )
    .select("id, briefing_id, module_id, module_key, enabled, settings, values, data_json, created_at, updated_at")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteModule(client: SupabaseClient, briefingId: string, moduleKey: string) {
  const { error } = await client
    .from("briefing_modules")
    .delete()
    .eq("briefing_id", briefingId)
    .eq("module_key", moduleKey);

  if (error) throw error;
}
