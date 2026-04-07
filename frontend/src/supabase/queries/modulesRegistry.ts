import { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_LAYOUT = {
  desktop: { x: 0, y: 0, w: 12, h: 3 },
  mobile: { x: 0, y: 0, w: 12, h: 4 },
  constraints: { minW: 3, minH: 2, maxW: 12, maxH: 8 },
  behavior: { draggable: true, resizable: true },
  style: { variant: "default", shape: "card", density: "comfortable" }
};

const DEFAULT_MODULES: Array<{
  name: string;
  type: string;
  version: number;
  icon: string;
  category: string;
  enabled: boolean;
  settings_schema: unknown[];
  field_schema: unknown[];
  default_settings: Record<string, unknown>;
  default_layout: typeof DEFAULT_LAYOUT;
  default_data: Record<string, unknown>;
}> = [
  {
    name: "Metadonnees",
    type: "metadata",
    version: 1,
    icon: "file-text",
    category: "general",
    enabled: true,
    settings_schema: [],
    field_schema: [],
    default_settings: {},
    default_layout: DEFAULT_LAYOUT,
    default_data: { main_contact_name: "", main_contact_phone: "", global_notes: "", team_mode: false, teams: [] }
  },
  {
    name: "Acces",
    type: "access",
    version: 1,
    icon: "map-pin",
    category: "operations",
    enabled: true,
    settings_schema: [],
    field_schema: [],
    default_settings: {},
    default_layout: DEFAULT_LAYOUT,
    default_data: { address: "", parking: "", entrance: "", on_site_contact: "" }
  },
  {
    name: "Livraisons",
    type: "delivery",
    version: 1,
    icon: "truck",
    category: "logistics",
    enabled: false,
    settings_schema: [
      {
        key: "enable_depot_tag",
        type: "boolean",
        label: "Activer le tag depot",
        description: "Permet de tagger une livraison comme depot"
      },
      {
        key: "enable_retour_tag",
        type: "boolean",
        label: "Activer le tag retour",
        description: "Permet de tagger une livraison comme retour"
      },
      {
        key: "allow_custom_tag",
        type: "boolean",
        label: "Autoriser un tag personnalise",
        description: "Permet de saisir un tag libre"
      }
    ],
    field_schema: [
      { key: "time", type: "time", label: "Time", placeholder: "Time" },
      { key: "place", type: "text", label: "Place", placeholder: "Place" },
      { key: "contact", type: "text", label: "Contact", placeholder: "Contact" },
      {
        key: "tag_mode",
        type: "select",
        label: "Tag",
        placeholder: "Select a tag",
        visibilityMode: "any",
        visibleWhen: [
          { source: "settings", path: "enable_depot_tag", truthy: true },
          { source: "settings", path: "enable_retour_tag", truthy: true },
          { source: "settings", path: "allow_custom_tag", truthy: true }
        ],
        options: [
          {
            value: "depot",
            label: "Depot",
            visibleWhen: [{ source: "settings", path: "enable_depot_tag", truthy: true }]
          },
          {
            value: "retour",
            label: "Retour",
            visibleWhen: [{ source: "settings", path: "enable_retour_tag", truthy: true }]
          },
          {
            value: "custom",
            label: "Custom",
            visibleWhen: [{ source: "settings", path: "allow_custom_tag", truthy: true }]
          }
        ]
      },
      {
        key: "custom_tag",
        type: "text",
        label: "Custom tag",
        placeholder: "Type a custom tag",
        visibleWhen: [{ source: "values", path: "tag_mode", equals: "custom" }]
      },
      { key: "notes", type: "textarea", label: "Notes", placeholder: "Notes" }
    ],
    default_settings: { enable_depot_tag: true, enable_retour_tag: true, allow_custom_tag: true },
    default_layout: DEFAULT_LAYOUT,
    default_data: { deliveries: [] }
  },
  {
    name: "Vehicules",
    type: "vehicle",
    version: 1,
    icon: "car",
    category: "logistics",
    enabled: false,
    settings_schema: [],
    field_schema: [],
    default_settings: {},
    default_layout: DEFAULT_LAYOUT,
    default_data: { vehicles: [] }
  },
  {
    name: "Equipement",
    type: "equipment",
    version: 1,
    icon: "wrench",
    category: "operations",
    enabled: false,
    settings_schema: [],
    field_schema: [],
    default_settings: {},
    default_layout: DEFAULT_LAYOUT,
    default_data: { items_text: "" }
  },
  {
    name: "Staff",
    type: "staff",
    version: 1,
    icon: "users",
    category: "team",
    enabled: false,
    settings_schema: [],
    field_schema: [],
    default_settings: {},
    default_layout: DEFAULT_LAYOUT,
    default_data: { roles: [] }
  },
  {
    name: "Notes",
    type: "notes",
    version: 1,
    icon: "sticky-note",
    category: "general",
    enabled: true,
    settings_schema: [],
    field_schema: [],
    default_settings: {},
    default_layout: DEFAULT_LAYOUT,
    default_data: { text: "" }
  },
  {
    name: "Contacts",
    type: "contact",
    version: 1,
    icon: "phone",
    category: "team",
    enabled: false,
    settings_schema: [],
    field_schema: [],
    default_settings: {},
    default_layout: DEFAULT_LAYOUT,
    default_data: { people: [] }
  }
];

const SELECT_MODULE_FIELDS =
  "id, name, type, version, icon, category, enabled, settings_schema, field_schema, default_settings, default_layout, default_data, created_at, updated_at";

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

export const getUserOrgId = getUserWorkspaceId;

export async function listGlobalModules(client: SupabaseClient) {
  const { data, error } = await client.from("modules").select(SELECT_MODULE_FIELDS).order("type", { ascending: true });
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

export const listRegistryModules = listWorkspaceModules;

export async function ensureRegistryModules(client: SupabaseClient, workspaceId: string) {
  const [existingGlobalModules, workspaceModules] = await Promise.all([
    listGlobalModules(client),
    listWorkspaceModuleRows(client, workspaceId)
  ]);

  let globalModules = existingGlobalModules;
  if (globalModules.length === 0) {
    const { data, error } = await client
      .from("modules")
      .upsert(DEFAULT_MODULES, { onConflict: "type" })
      .select(SELECT_MODULE_FIELDS)
      .order("type", { ascending: true });
    if (error) throw error;
    globalModules = data ?? [];
  }

  const existingOverrides = new Set(workspaceModules.map((item) => item.module_id));
  const missingOverrides = globalModules
    .filter((module) => !existingOverrides.has(module.id))
    .map((module) => ({
      workspace_id: workspaceId,
      module_id: module.id,
      enabled: module.enabled
    }));

  if (missingOverrides.length > 0) {
    const { error } = await client
      .from("workspace_modules")
      .upsert(missingOverrides, { onConflict: "workspace_id,module_id" });
    if (error) throw error;
  }

  return listWorkspaceModules(client, workspaceId);
}

export async function updateRegistryModuleEnabled(client: SupabaseClient, workspaceId: string, moduleId: string, enabled: boolean) {
  const { error } = await client
    .from("workspace_modules")
    .upsert({ workspace_id: workspaceId, module_id: moduleId, enabled }, { onConflict: "workspace_id,module_id" });

  if (error) throw error;

  const modules = await listWorkspaceModules(client, workspaceId);
  const resolved = modules.find((module) => module.id === moduleId);
  if (!resolved) throw new Error("Module not found after workspace update");
  return resolved;
}

export const updateWorkspaceModuleEnabled = updateRegistryModuleEnabled;
