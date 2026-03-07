import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { downloadPdf, patchBriefing, toApiMessage, upsertBriefingModules } from "@/lib/api";
import { tryResizeModuleRect } from "@/lib/moduleLayout";
import { parseModuleRow, toCanonicalModuleJson } from "@/lib/moduleCanonical";
import { moduleEntries, moduleRegistry } from "@/lib/moduleRegistry";
import { Briefing, BriefingModuleRow, EditorState, ModuleDataMap, ModuleKey, RegistryModule } from "@/lib/types";
import { MetadataForm } from "@/components/briefing/MetadataForm";
import { MetadataPreview } from "@/components/briefing/preview/MetadataPreview";
import { ModuleList } from "@/components/briefing/ModuleList";
import { ModulePanel } from "@/components/briefing/ModulePanel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const CANVAS_COLS = 12;
const CANVAS_ROWS = 24;

export function buildInitialState(
  briefing: Briefing,
  rows: BriefingModuleRow[],
  registryModules: RegistryModule[] = []
): EditorState {
  const rowMap = new Map(rows.map((row) => [row.module_key, row]));
  const registryMap = new Map(registryModules.map((mod) => [mod.type, mod]));

  const modules = Object.fromEntries(
    moduleEntries.map((entry) => {
      const parsed = parseModuleRow({
        key: entry.key,
        row: rowMap.get(entry.key),
        entry,
        registryModule: registryMap.get(entry.key) as RegistryModule | undefined
      });

      return [
        entry.key,
        {
          module_id: parsed.module_id,
          key: entry.key,
          enabled: parsed.enabled,
          metadata: parsed.metadata,
          audience: parsed.audience,
          layout: parsed.layout,
          data: parsed.data
        }
      ];
    })
  ) as EditorState["modules"];

  const defaultSelected = (moduleEntries.find((entry) => entry.key !== "metadata" && modules[entry.key].enabled)?.key ?? "access") as Exclude<
    ModuleKey,
    "metadata"
  >;

  return {
    core: {
      title: briefing.title,
      event_date: briefing.event_date,
      location_text: briefing.location_text ?? ""
    },
    selectedModuleKey: defaultSelected,
    modules
  };
}

type Props = {
  briefing: Briefing;
  modules: BriefingModuleRow[];
  registryModules?: RegistryModule[];
};

function toCanvasStyle(layout: EditorState["modules"][ModuleKey]["layout"]) {
  const desktop = layout.desktop;
  return {
    left: `${(desktop.x / CANVAS_COLS) * 100}%`,
    top: `${(desktop.y / CANVAS_ROWS) * 100}%`,
    width: `${(desktop.w / CANVAS_COLS) * 100}%`,
    height: `${(desktop.h / CANVAS_ROWS) * 100}%`
  };
}

export function BriefingEditor({ briefing, modules, registryModules = [] }: Props) {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState<EditorState>(() => buildInitialState(briefing, modules, registryModules));
  const [saving, setSaving] = useState(false);
  const lastSaved = useRef("");

  useEffect(() => {
    const snapshot = JSON.stringify(state);
    if (!lastSaved.current) {
      lastSaved.current = snapshot;
      return;
    }

    if (snapshot === lastSaved.current) return;

    const id = window.setTimeout(() => {
      void handleSave(false);
    }, 800);

    return () => window.clearTimeout(id);
  }, [state]);

  const payload = useMemo(
    () =>
      (Object.keys(state.modules) as ModuleKey[]).map((key) => ({
        module_id: state.modules[key].module_id ?? null,
        module_key: key,
        enabled: state.modules[key].enabled,
        data_json: toCanonicalModuleJson({
          key,
          moduleId: state.modules[key].module_id ?? null,
          metadata: { ...state.modules[key].metadata, enabled: state.modules[key].enabled },
          audience: state.modules[key].audience,
          layout: state.modules[key].layout,
          data: state.modules[key].data
        })
      })),
    [state.modules]
  );

  const handleSave = async (manual = true) => {
    try {
      setSaving(true);
      await patchBriefing(briefing.id, {
        title: state.core.title,
        event_date: state.core.event_date,
        location_text: state.core.location_text
      });
      await upsertBriefingModules(briefing.id, payload);
      lastSaved.current = JSON.stringify(state);
      if (manual) toast.success(t("editor.saved"));
    } catch (error) {
      toast.error(`${t("editor.saveError")}: ${toApiMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePdf = async () => {
    try {
      const blob = await downloadPdf(briefing.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `briefing-${briefing.id}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      const msg = toApiMessage(error);
      toast.error(msg.includes("limit") ? t("editor.pdfDenied") : msg);
    }
  };

  const handleResizeModule = (key: ModuleKey, deltaW: number, deltaH: number) => {
    setState((prev) => {
      const current = prev.modules[key];
      const others = (Object.keys(prev.modules) as ModuleKey[])
        .filter((otherKey) => otherKey !== key && prev.modules[otherKey].enabled)
        .map((otherKey) => prev.modules[otherKey].layout.desktop);

      const resized = tryResizeModuleRect({
        current: current.layout.desktop,
        others,
        deltaW,
        deltaH,
        minW: current.layout.constraints.minW,
        minH: current.layout.constraints.minH,
        maxW: current.layout.constraints.maxW,
        maxH: current.layout.constraints.maxH,
        cols: CANVAS_COLS,
        rows: CANVAS_ROWS
      });

      if (!resized) return prev;

      return {
        ...prev,
        modules: {
          ...prev.modules,
          [key]: {
            ...prev.modules[key],
            layout: {
              ...prev.modules[key].layout,
              desktop: resized,
              mobile: {
                ...prev.modules[key].layout.mobile,
                w: Math.min(resized.w, CANVAS_COLS),
                h: Math.max(prev.modules[key].layout.mobile.h, 1)
              }
            }
          }
        }
      };
    });
  };

  const visibleModules = moduleEntries.filter((entry) => state.modules[entry.key].enabled);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
      <Card className="flex justify-center p-4">
        <div className="a4-frame w-full max-w-[820px] rounded-xl border border-slate-300 bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900">
          <div className="relative mx-auto aspect-[210/297] w-full overflow-hidden rounded-lg border border-[#e8eaf3] bg-white dark:border-white/10 dark:bg-[#0f0f10]">
            {visibleModules.map((entry) => {
              const module = state.modules[entry.key];
              const style = toCanvasStyle(module.layout);
              const isSelected = state.selectedModuleKey === entry.key;
              const PreviewComponent = moduleRegistry[entry.key].PreviewComponent;

              return (
                <section
                  key={entry.key}
                  style={style}
                  className={`absolute overflow-hidden rounded-md border bg-white/95 p-2 shadow-sm dark:bg-[#151515] ${
                    isSelected ? "border-brand-500" : "border-[#dfe3ef] dark:border-white/10"
                  }`}
                  onClick={() => {
                    if (entry.key !== "metadata") {
                      setState((prev) => ({ ...prev, selectedModuleKey: entry.key as Exclude<ModuleKey, "metadata"> }));
                    }
                  }}
                >
                  <p className="mb-1 truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {entry.labels[i18n.language === "fr" ? "fr" : "en"]}
                  </p>

                  <div className="max-h-[calc(100%-20px)] overflow-auto text-xs">
                    {entry.key === "metadata" ? (
                      <MetadataPreview
                        title={state.core.title}
                        eventDate={state.core.event_date}
                        location={state.core.location_text}
                        metadata={state.modules.metadata.data}
                      />
                    ) : (
                      <PreviewComponent value={module.data as never} />
                    )}
                  </div>

                  <button
                    type="button"
                    aria-label={`resize-${entry.key}-shrink`}
                    className="absolute left-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#d4d9ea] bg-white text-[10px] font-bold"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleResizeModule(entry.key, -1, -1);
                    }}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    aria-label={`resize-${entry.key}-wider`}
                    className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#d4d9ea] bg-white text-[10px] font-bold"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleResizeModule(entry.key, +1, 0);
                    }}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    aria-label={`resize-${entry.key}-taller`}
                    className="absolute bottom-1 left-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#d4d9ea] bg-white text-[10px] font-bold"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleResizeModule(entry.key, 0, +1);
                    }}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    aria-label={`resize-${entry.key}-grow`}
                    className="absolute bottom-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#d4d9ea] bg-white text-[10px] font-bold"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleResizeModule(entry.key, +1, +1);
                    }}
                  >
                    +
                  </button>
                </section>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="rounded-2xl border border-[#e8eaf3] p-3 dark:border-white/10">
          <MetadataForm
            core={state.core}
            metadata={state.modules.metadata.data}
            onChange={(core, metadata) => {
              setState((prev) => ({
                ...prev,
                core,
                modules: {
                  ...prev.modules,
                  metadata: { ...prev.modules.metadata, data: metadata }
                }
              }));
            }}
          />
        </div>

        <div className="rounded-2xl border border-[#e8eaf3] p-3 dark:border-white/10">
          <ModuleList
            state={state}
            selected={state.selectedModuleKey}
            onSelect={(key) => setState((prev) => ({ ...prev, selectedModuleKey: key }))}
            onToggle={(key, enabled) =>
              setState((prev) => ({
                ...prev,
                modules: {
                  ...prev.modules,
                  [key]: {
                    ...prev.modules[key],
                    enabled,
                    metadata: { ...prev.modules[key].metadata, enabled }
                  }
                }
              }))
            }
          />
        </div>

        <div className="rounded-2xl border border-[#e8eaf3] p-3 dark:border-white/10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Edition module</p>
          <ModulePanel
            state={state}
            selected={state.selectedModuleKey}
            onChange={(key, data) =>
              setState((prev) => ({
                ...prev,
                modules: {
                  ...prev.modules,
                  [key]: {
                    ...prev.modules[key],
                    data: data as ModuleDataMap[typeof key]
                  }
                }
              }))
            }
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={() => void handleSave(true)} disabled={saving}>{saving ? t("app.loading") : t("app.save")}</Button>
          <Button variant="secondary" onClick={() => void handlePdf()}>{t("app.downloadPdf")}</Button>
        </div>
      </Card>
    </div>
  );
}
