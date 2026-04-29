import {
  BriefingModuleRow,
  ModuleAudience,
  ModuleDataMap,
  ModuleDefinitionEntry,
  ModuleKey,
  ModuleLayout,
  ModuleMetadata,
  RegistryModule
} from "@/lib/types";

const DEFAULT_AUDIENCE: ModuleAudience = {
  mode: "all",
  teams: [],
  visibility: "visible"
};

const DEFAULT_LAYOUT: ModuleLayout = {
  desktop: { x: 0, y: 0, w: 12, h: 3, page: 0 },
  mobile: { x: 0, y: 0, w: 12, h: 4 },
  constraints: { minW: 3, minH: 2, maxW: 12, maxH: 8 },
  behavior: { draggable: true, resizable: true },
  style: { variant: "default", shape: "card", density: "comfortable" }
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAudience(value: unknown): ModuleAudience {
  if (!isObject(value)) return DEFAULT_AUDIENCE;
  const mode = value.mode === "teams" ? "teams" : "all";
  const teams = Array.isArray(value.teams) ? value.teams.filter((v): v is string => typeof v === "string") : [];
  const visibility = value.visibility === "hidden" ? "hidden" : "visible";
  return { mode, teams, visibility };
}

function parseLayout(value: unknown): ModuleLayout {
  if (!isObject(value)) return DEFAULT_LAYOUT;
  const desktop = isObject(value.desktop) ? value.desktop : {};
  const mobile = isObject(value.mobile) ? value.mobile : {};
  const constraints = isObject(value.constraints) ? value.constraints : {};
  const behavior = isObject(value.behavior) ? value.behavior : {};
  const style = isObject(value.style) ? value.style : {};

  return {
    desktop: {
      x: Number(desktop.x ?? DEFAULT_LAYOUT.desktop.x),
      y: Number(desktop.y ?? DEFAULT_LAYOUT.desktop.y),
      w: Number(desktop.w ?? DEFAULT_LAYOUT.desktop.w),
      h: Number(desktop.h ?? DEFAULT_LAYOUT.desktop.h),
      page: Math.max(0, Number(desktop.page ?? DEFAULT_LAYOUT.desktop.page))
    },
    mobile: {
      x: Number(mobile.x ?? DEFAULT_LAYOUT.mobile.x),
      y: Number(mobile.y ?? DEFAULT_LAYOUT.mobile.y),
      w: Number(mobile.w ?? DEFAULT_LAYOUT.mobile.w),
      h: Number(mobile.h ?? DEFAULT_LAYOUT.mobile.h)
    },
    constraints: {
      minW: Number(constraints.minW ?? DEFAULT_LAYOUT.constraints.minW),
      minH: Number(constraints.minH ?? DEFAULT_LAYOUT.constraints.minH),
      maxW: Number(constraints.maxW ?? DEFAULT_LAYOUT.constraints.maxW),
      maxH: Number(constraints.maxH ?? DEFAULT_LAYOUT.constraints.maxH)
    },
    behavior: {
      draggable: behavior.draggable !== false,
      resizable: behavior.resizable !== false
    },
    style: {
      variant: String(style.variant ?? DEFAULT_LAYOUT.style.variant),
      shape: String(style.shape ?? DEFAULT_LAYOUT.style.shape),
      density: String(style.density ?? DEFAULT_LAYOUT.style.density)
    }
  };
}

export function buildDefaultMetadata<K extends ModuleKey>(
  key: K,
  entry: ModuleDefinitionEntry<K>,
  registryModule?: RegistryModule | null
): ModuleMetadata {
  const now = new Date().toISOString();
  return {
    type: key,
    label: registryModule?.name ?? entry.labels.fr,
    version: registryModule?.version ?? 1,
    enabled: registryModule?.enabled ?? entry.defaultEnabled,
    order: entry.order,
    description: entry.description.fr,
    icon: registryModule?.icon ?? "box",
    category: registryModule?.category ?? "general",
    created_at: registryModule?.created_at ?? now,
    updated_at: registryModule?.updated_at ?? now
  };
}

export function parseModuleRow<K extends ModuleKey>(params: {
  key: K;
  row?: BriefingModuleRow;
  entry: ModuleDefinitionEntry<K>;
  registryModule?: RegistryModule | null;
}): {
  module_id: string | null;
  enabled: boolean;
  metadata: ModuleMetadata;
  audience: ModuleAudience;
  layout: ModuleLayout;
  settings: Record<string, unknown>;
  data: ModuleDataMap[K];
} {
  const { key, row, entry, registryModule } = params;
  const baseData = entry.schema.parse(registryModule?.default_data ?? entry.defaultData);
  const baseSettings = entry.settingsSchema
    ? entry.settingsSchema.parse(registryModule?.default_settings ?? entry.defaultSettings ?? {})
    : {};
  const baseMetadata = buildDefaultMetadata(key, entry, registryModule);
  const baseLayout = parseLayout(registryModule?.default_layout);

  if (!row) {
    return {
      module_id: registryModule?.id ?? null,
      enabled: registryModule?.enabled ?? entry.defaultEnabled,
      metadata: baseMetadata,
      audience: DEFAULT_AUDIENCE,
      layout: baseLayout,
      settings: baseSettings,
      data: baseData
    };
  }

  const raw = row.data_json;
  if (isObject(raw) && "metadata" in raw && "audience" in raw && "layout" in raw && "data" in raw) {
    const metadata = isObject(raw.metadata)
      ? {
          ...baseMetadata,
          ...raw.metadata,
          type: key,
          enabled: row.enabled,
          updated_at: row.updated_at
        }
      : { ...baseMetadata, enabled: row.enabled, updated_at: row.updated_at };

    return {
      module_id: row.module_id ?? registryModule?.id ?? null,
      enabled: row.enabled,
      metadata,
      audience: parseAudience(raw.audience),
      layout: parseLayout(raw.layout),
      settings: entry.settingsSchema ? entry.settingsSchema.parse(raw.settings ?? row.settings ?? baseSettings) : {},
      data: entry.schema.parse(raw.data ?? baseData)
    };
  }

  return {
    module_id: row.module_id ?? registryModule?.id ?? null,
    enabled: row.enabled,
    metadata: { ...baseMetadata, enabled: row.enabled, updated_at: row.updated_at },
    audience: DEFAULT_AUDIENCE,
    layout: baseLayout,
    settings: entry.settingsSchema ? entry.settingsSchema.parse(row.settings ?? baseSettings) : {},
    data: entry.schema.parse(row.values ?? raw ?? baseData)
  };
}

export function toCanonicalModuleJson<K extends ModuleKey>(params: {
  key: K;
  moduleId: string | null;
  metadata: ModuleMetadata;
  audience: ModuleAudience;
  layout: ModuleLayout;
  settings: Record<string, unknown>;
  data: ModuleDataMap[K];
}) {
  const now = new Date().toISOString();
  return {
    id: params.moduleId ? `${params.key}_${params.moduleId}` : `${params.key}_local`,
    metadata: {
      ...params.metadata,
      type: params.key,
      updated_at: now
    },
    audience: params.audience,
    layout: params.layout,
    settings: params.settings,
    data: params.data
  };
}

export { DEFAULT_AUDIENCE, DEFAULT_LAYOUT };
