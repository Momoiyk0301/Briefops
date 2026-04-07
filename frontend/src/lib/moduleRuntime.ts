import { ModuleFieldDefinition, ModuleFieldOption, ModuleSettingDefinition, ModuleVisibilityRule } from "@/lib/types";

function readPath(source: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    return (current as Record<string, unknown>)[key];
  }, source);
}

function isRuleVisible(rule: ModuleVisibilityRule, settings: Record<string, unknown>, values: Record<string, unknown>) {
  const source = rule.source === "settings" ? settings : values;
  const resolved = readPath(source, rule.path);

  if (typeof rule.truthy === "boolean") {
    return rule.truthy ? Boolean(resolved) : !resolved;
  }
  if (rule.equals !== undefined) {
    return resolved === rule.equals;
  }
  if (rule.notEquals !== undefined) {
    return resolved !== rule.notEquals;
  }
  return Boolean(resolved);
}

export function isFieldVisible(
  field: Pick<ModuleFieldDefinition, "visibleWhen" | "visibilityMode"> | Pick<ModuleFieldOption, "visibleWhen">,
  settings: Record<string, unknown>,
  values: Record<string, unknown>
) {
  if (!field.visibleWhen?.length) return true;

  const visibilityMode = "visibilityMode" in field ? field.visibilityMode ?? "all" : "all";
  const results = field.visibleWhen.map((rule) => isRuleVisible(rule, settings, values));
  return visibilityMode === "any" ? results.some(Boolean) : results.every(Boolean);
}

export function getVisibleFieldOptions(
  field: Pick<ModuleFieldDefinition, "options">,
  settings: Record<string, unknown>,
  values: Record<string, unknown>
) {
  return (field.options ?? []).filter((option) => isFieldVisible(option, settings, values));
}

export function createEmptyFieldValues(fields: ModuleFieldDefinition[]) {
  return fields.reduce<Record<string, unknown>>((acc, field) => {
    acc[field.key] = "";
    return acc;
  }, {});
}

export function normalizeBooleanSettings(
  settingsSchema: ModuleSettingDefinition[],
  rawSettings: Record<string, unknown> | null | undefined
) {
  return settingsSchema.reduce<Record<string, unknown>>((acc, setting) => {
    acc[setting.key] = Boolean(rawSettings?.[setting.key]);
    return acc;
  }, {});
}
