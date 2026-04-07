import { SupabaseClient } from "@supabase/supabase-js";

const SELECT_MODULE_FIELDS =
  "id, name, type, version, icon, category, enabled, default_layout, default_data, created_at, updated_at";

const SELECT_WORKSPACE_MODULE_FIELDS =
  "id, workspace_id, module_id, enabled, created_at, updated_at";

export async function getUserWorkspaceId(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("memberships")
    .select("workspace_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.workspace_id ?? null;
}

export async function listGlobalModules(client: SupabaseClient) {
  const { data, error } = await client
    .from("modules")
    .select(SELECT_MODULE_FIELDS)
    .order("type", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function listWorkspaceModuleRows(client: SupabaseClient, workspaceId: string) {
  const { data, error } = await client
    .from("workspace_modules")
    .select(SELECT_WORKSPACE_MODULE_FIELDS)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
  return data ?? [];
}

export async function listWorkspaceModules(client: SupabaseClient, workspaceId: string) {
  const [modules, workspaceModules] = await Promise.all([
    listGlobalModules(client),
    listWorkspaceModuleRows(client, workspaceId)
  ]);

  const overrides = new Map(workspaceModules.map((item) => [item.module_id, item]));

  return modules.map((module) => {
    const override = overrides.get(module.id);
    const workspaceEnabled = override?.enabled ?? module.enabled;

    return {
      ...module,
      enabled: Boolean(module.enabled && workspaceEnabled),
      global_enabled: Boolean(module.enabled),
      workspace_enabled: Boolean(workspaceEnabled),
      workspace_module_id: override?.id ?? null
    };
  });
}

export async function updateWorkspaceModuleEnabled(
  client: SupabaseClient,
  workspaceId: string,
  moduleId: string,
  enabled: boolean
) {
  const { error } = await client
    .from("workspace_modules")
    .upsert(
      {
        workspace_id: workspaceId,
        module_id: moduleId,
        enabled
      },
      { onConflict: "workspace_id,module_id" }
    );

  if (error) throw error;

  const modules = await listWorkspaceModules(client, workspaceId);
  const resolved = modules.find((module) => module.id === moduleId);
  if (!resolved) {
    throw new Error("Module not found after workspace update");
  }

  return resolved;
}
