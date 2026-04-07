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
    default_layout: DEFAULT_LAYOUT,
    default_data: { people: [] }
  }
];

const SELECT_REGISTRY_FIELDS =
  "id, org_id, name, type, version, icon, category, enabled, default_layout, default_data, created_at, updated_at";

export async function getUserOrgId(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("memberships")
    .select("workspace_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.workspace_id ?? null;
}

export async function listRegistryModules(client: SupabaseClient, orgId: string) {
  const { data, error } = await client
    .from("modules")
    .select(SELECT_REGISTRY_FIELDS)
    .eq("org_id", orgId)
    .order("type", { ascending: true });

  if (error) throw error;
  return data;
}

export async function ensureRegistryModules(client: SupabaseClient, orgId: string) {
  const existing = await listRegistryModules(client, orgId);
  if (existing.length > 0) return existing;

  const payload = DEFAULT_MODULES.map((item) => ({
    org_id: orgId,
    ...item
  }));

  const { data, error } = await client
    .from("modules")
    .upsert(payload, { onConflict: "org_id,type" })
    .select(SELECT_REGISTRY_FIELDS)
    .order("type", { ascending: true });

  if (error) throw error;
  return data;
}

export async function updateRegistryModuleEnabled(
  client: SupabaseClient,
  orgId: string,
  moduleId: string,
  enabled: boolean
) {
  const { data, error } = await client
    .from("modules")
    .update({ enabled })
    .eq("id", moduleId)
    .eq("org_id", orgId)
    .select(SELECT_REGISTRY_FIELDS)
    .single();

  if (error) throw error;
  return data;
}
