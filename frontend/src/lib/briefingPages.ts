import { ModuleKey, ModuleLayout } from "@/lib/types";

type DesktopLayout = ModuleLayout["desktop"];

export function getDesktopPage(desktop?: Partial<DesktopLayout> | null): number {
  return Math.max(0, Number(desktop?.page ?? 0) || 0);
}

export function getPageCountFromLayouts(layouts: Array<Partial<DesktopLayout> | null | undefined>): number {
  return Math.max(1, ...layouts.map((layout) => getDesktopPage(layout) + 1));
}

export function getEnabledPageCount<K extends ModuleKey>(modules: Record<K, { enabled: boolean; layout: ModuleLayout }>): number {
  const enabledLayouts = Object.values(modules)
    .filter((module) => module.enabled)
    .map((module) => module.layout.desktop);
  return getPageCountFromLayouts(enabledLayouts);
}
