import { PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Plus, Share2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import {
  createBriefingExportJob,
  downloadBriefingExport,
  getBriefingExportJob,
  patchBriefing,
  startBriefingExportJob,
  toApiMessage,
  upsertBriefingModules
} from "@/lib/api";
import { getEnabledPageCount } from "@/lib/briefingPages";
import { GridRect, ResizeHandle, tryMoveModuleRect, tryResizeModuleRect } from "@/lib/moduleLayout";
import { parseModuleRow, toCanonicalModuleJson } from "@/lib/moduleCanonical";
import { moduleEntries, moduleRegistry } from "@/lib/moduleRegistry";
import { Briefing, BriefingModuleRow, EditorState, ModuleDataMap, ModuleKey, RegistryModule } from "@/lib/types";
import { MetadataForm } from "@/components/briefing/MetadataForm";
import { MetadataPreview } from "@/components/briefing/preview/MetadataPreview";
import { ModuleList } from "@/components/briefing/ModuleList";
import { ModulePanel } from "@/components/briefing/ModulePanel";
import { SharePanel } from "@/components/briefing/SharePanel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const CANVAS_COLS = 12;
const CANVAS_ROWS = 24;

function rectTouchesOrOverlaps(a: GridRect, b: GridRect) {
  if ((a.page ?? 0) !== (b.page ?? 0)) return false;
  return a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y;
}

function normalizeLayouts(modules: EditorState["modules"]) {
  const placed: GridRect[] = [];
  const next = { ...modules } as Record<ModuleKey, EditorState["modules"][ModuleKey]>;

  moduleEntries.forEach((entry, index) => {
    const current = next[entry.key];
    if (!current.enabled) return;

    let rect = { ...current.layout.desktop };
    let attempts = 0;

    while (placed.some((p) => rectTouchesOrOverlaps(rect, p)) && attempts < CANVAS_ROWS) {
      rect = {
        ...rect,
        y: Math.min(CANVAS_ROWS - rect.h, Math.max(0, rect.y + 1 + (index % 2)))
      };
      attempts += 1;
    }

    next[entry.key] = {
      ...current,
      layout: {
        ...current.layout,
        desktop: rect
      }
    };

    placed.push(rect);
  });

  return next as EditorState["modules"];
}

export function buildInitialState(
  briefing: Briefing,
  rows: BriefingModuleRow[],
  registryModules: RegistryModule[] = []
): EditorState {
  const rowMap = new Map(rows.map((row) => [row.module_key, row]));
  const registryMap = new Map(registryModules.map((mod) => [mod.type, mod]));

  const rawModules = Object.fromEntries(
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

  const modules = normalizeLayouts(rawModules);

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
  saveNonce?: number;
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

const RESIZE_HANDLES: Array<{ key: ResizeHandle; className: string; cursor: string }> = [
  { key: "nw", className: "left-0 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "nwse-resize" },
  { key: "ne", className: "right-0 top-0 translate-x-1/2 -translate-y-1/2", cursor: "nesw-resize" },
  { key: "se", className: "bottom-0 right-0 translate-x-1/2 translate-y-1/2", cursor: "nwse-resize" },
  { key: "sw", className: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2", cursor: "nesw-resize" },
  { key: "w", className: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2", cursor: "ew-resize" },
  { key: "e", className: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2", cursor: "ew-resize" },
  { key: "s", className: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2", cursor: "ns-resize" }
];

const MODULE_TONE_CLASS: Record<ModuleKey, string> = {
  metadata: "border-sky-200/90 bg-sky-50/80",
  access: "border-emerald-200/90 bg-emerald-50/80",
  delivery: "border-amber-200/90 bg-amber-50/80",
  vehicle: "border-violet-200/90 bg-violet-50/80",
  equipment: "border-cyan-200/90 bg-cyan-50/80",
  staff: "border-rose-200/90 bg-rose-50/80",
  notes: "border-indigo-200/90 bg-indigo-50/80",
  contact: "border-orange-200/90 bg-orange-50/80"
};

function slugifyFilename(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "briefing"
  );
}

export function BriefingEditor({ briefing, modules, registryModules = [], saveNonce = 0 }: Props) {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState<EditorState>(() => buildInitialState(briefing, modules, registryModules));
  const [saving, setSaving] = useState(false);
  const [hoveredModuleKey, setHoveredModuleKey] = useState<ModuleKey | null>(null);
  const [mobilePanel, setMobilePanel] = useState<"meta" | "modules" | "edit">("modules");
  const [pdfButtonState, setPdfButtonState] = useState<"idle" | "creating" | "generating" | "ready" | "failed">("idle");
  const [shareOpen, setShareOpen] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState<"hidden" | "saving" | "saved">("hidden");
  const [pageCountOverride, setPageCountOverride] = useState<number>(() => getEnabledPageCount(buildInitialState(briefing, modules, registryModules).modules));
  const canvasRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const lastSaved = useRef("");

  useEffect(() => {
    const snapshot = JSON.stringify(state);
    if (!lastSaved.current) {
      lastSaved.current = snapshot;
      return;
    }

    if (snapshot === lastSaved.current) return;

    const id = window.setTimeout(() => {
      setSaveIndicator("saving");
      void handleSave(false);
    }, 800);

    return () => window.clearTimeout(id);
  }, [state]);

  const teamModeEnabled = state.modules.metadata.data.team_mode;
  const definedTeams = state.modules.metadata.data.teams;

  useEffect(() => {
    setState((prev) => {
      let changed = false;
      const nextModules = { ...prev.modules } as EditorState["modules"];
      const teamSet = new Set(definedTeams.map((team) => team.toLowerCase()));

      (Object.keys(prev.modules) as ModuleKey[])
        .filter((key) => key !== "metadata")
        .forEach((key) => {
          const module = prev.modules[key];
          const filteredTeams = module.audience.teams.filter((team) => teamSet.has(team.toLowerCase()));
          const nextMode = teamModeEnabled && filteredTeams.length > 0 ? "teams" : "all";

          if (nextMode !== module.audience.mode || filteredTeams.length !== module.audience.teams.length) {
            changed = true;
            const updatedModule: typeof module = {
              ...module,
              audience: {
                ...module.audience,
                mode: nextMode,
                teams: filteredTeams
              }
            };
            (nextModules as Record<string, EditorState["modules"][ModuleKey]>)[key] = updatedModule;
          }
        });

      if (!changed) return prev;
      return { ...prev, modules: nextModules };
    });
  }, [definedTeams, teamModeEnabled]);

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
      if (!manual) setSaveIndicator("saved");
    } catch (error) {
      toast.error(`${t("editor.saveError")}: ${toApiMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!saveNonce) return;
    void handleSave(true);
  }, [saveNonce]);

  const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const downloadExportFile = async (exportId: string, version: number) => {
    const { blob, filename } = await downloadBriefingExport(exportId);
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename ?? `${slugifyFilename(state.core.title)}-v${version}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  const pollExportUntilReady = async (exportId: string) => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const status = await getBriefingExportJob(briefing.id, exportId);
      if (status.status === "ready") return status;
      if (status.status === "failed") {
        throw new Error(status.error_message ?? t("editor.pdfDenied"));
      }
      await wait(2000);
    }

    throw new Error("Le PDF prend plus de temps que prévu.");
  };

  const handlePdf = async () => {
    const toastId = toast.loading(t("editor.pdfGenerating"));
    try {
      setPdfButtonState("creating");
      const created = await createBriefingExportJob(briefing.id);
      setPdfButtonState("generating");
      await startBriefingExportJob(briefing.id, created.export_id);
      const finalExport = await pollExportUntilReady(created.export_id);
      await downloadExportFile(created.export_id, finalExport.version);
      setPdfButtonState("ready");
      toast.success(t("editor.pdfReady"), { id: toastId });
    } catch (error) {
      toast.error(toApiMessage(error), { id: toastId });
      setPdfButtonState("failed");
    }
  };

  const startPointerInteraction = (
    event: ReactPointerEvent,
    key: ModuleKey,
    page: number,
    mode: "move" | "resize",
    handle?: ResizeHandle
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const canvas = canvasRefs.current[page];
    if (!canvas) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const bodyStyle = document.body.style;
    const prevTouchAction = bodyStyle.touchAction;
    const prevUserSelect = bodyStyle.userSelect;
    bodyStyle.touchAction = "none";
    bodyStyle.userSelect = "none";
    const cellW = canvas.clientWidth / CANVAS_COLS;
    const cellH = canvas.clientHeight / CANVAS_ROWS;

    const initialRect = { ...state.modules[key].layout.desktop };
    const constraints = state.modules[key].layout.constraints;
    const others = (Object.keys(state.modules) as ModuleKey[])
      .filter(
        (otherKey) =>
          otherKey !== key &&
          state.modules[otherKey].enabled &&
          state.modules[otherKey].layout.desktop.page === page
      )
      .map((otherKey) => state.modules[otherKey].layout.desktop);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = Math.round((moveEvent.clientX - startX) / cellW);
      const deltaY = Math.round((moveEvent.clientY - startY) / cellH);

      if (deltaX === 0 && deltaY === 0) return;

      const nextRect = mode === "move"
        ? tryMoveModuleRect({
            current: initialRect,
            others,
            deltaX,
            deltaY,
            cols: CANVAS_COLS,
            rows: CANVAS_ROWS
          })
        : tryResizeModuleRect({
            current: initialRect,
            others,
            handle: handle!,
            deltaX,
            deltaY,
            minW: constraints.minW,
            minH: constraints.minH,
            maxW: constraints.maxW,
            maxH: constraints.maxH,
            cols: CANVAS_COLS,
            rows: CANVAS_ROWS
          });

      if (!nextRect) return;

      setState((prev) => ({
        ...prev,
        modules: {
          ...prev.modules,
          [key]: {
              ...prev.modules[key],
              layout: {
                ...prev.modules[key].layout,
                desktop: { ...nextRect, page }
              }
            }
          }
      }));
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      bodyStyle.touchAction = prevTouchAction;
      bodyStyle.userSelect = prevUserSelect;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  const visibleModules = moduleEntries.filter((entry) => state.modules[entry.key].enabled);
  const selectedModule = state.modules[state.selectedModuleKey];
  const selectedAudienceTeams = selectedModule.audience.teams;
  const pageCount = Math.max(pageCountOverride, getEnabledPageCount(state.modules));

  const visibleModulesByPage = useMemo(
    () =>
      Array.from({ length: pageCount }, (_, pageIndex) => ({
        pageIndex,
        items: visibleModules.filter((entry) => state.modules[entry.key].layout.desktop.page === pageIndex)
      })),
    [pageCount, state.modules, visibleModules]
  );

  const toggleTeamForSelectedModule = (team: string) => {
    setState((prev) => {
      const module = prev.modules[prev.selectedModuleKey];
      const exists = module.audience.teams.some((value) => value.toLowerCase() === team.toLowerCase());
      const teams = exists
        ? module.audience.teams.filter((value) => value.toLowerCase() !== team.toLowerCase())
        : [...module.audience.teams, team];

      return {
        ...prev,
        modules: {
          ...prev.modules,
          [prev.selectedModuleKey]: {
            ...module,
            audience: {
              ...module.audience,
              mode: teams.length > 0 ? "teams" : "all",
              teams
            }
          }
        }
      };
    });
  };

  const updateSelectedModulePage = (page: number) => {
    setState((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [prev.selectedModuleKey]: {
          ...prev.modules[prev.selectedModuleKey],
          layout: {
            ...prev.modules[prev.selectedModuleKey].layout,
            desktop: {
              ...prev.modules[prev.selectedModuleKey].layout.desktop,
              page
            }
          }
        }
      }
    }));
  };

  const handleAddPage = () => {
    setPageCountOverride((prev) => prev + 1);
  };

  const handleRemovePage = (pageIndex: number) => {
    if (pageCount <= 1) return;
    setState((prev) => ({
      ...prev,
      modules: normalizeLayouts(
        Object.fromEntries(
          (Object.keys(prev.modules) as ModuleKey[]).map((key) => {
            const module = prev.modules[key];
            const currentPage = module.layout.desktop.page ?? 0;
            const nextPage = currentPage === pageIndex ? Math.max(0, pageIndex - 1) : currentPage > pageIndex ? currentPage - 1 : currentPage;
            return [
              key,
              {
                ...module,
                layout: {
                  ...module.layout,
                  desktop: {
                    ...module.layout.desktop,
                    page: nextPage
                  }
                }
              }
            ];
          })
        ) as EditorState["modules"]
      )
    }));
    setPageCountOverride((prev) => Math.max(1, prev - 1));
  };

  return (
    <div className="space-y-4">
      <Card className="hidden border-[#e6ebf5] bg-white/92 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#121212] xl:block">
        <div className="grid gap-4 xl:grid-cols-4">
          <div className="xl:col-span-4">
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
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
        <Card className="space-y-3 border-[#e6ebf5] bg-white/92 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#121212]">
          <div className="grid grid-cols-3 gap-2 xl:hidden">
            <Button variant={mobilePanel === "meta" ? "primary" : "secondary"} onClick={() => setMobilePanel("meta")}>Meta</Button>
            <Button variant={mobilePanel === "modules" ? "primary" : "secondary"} onClick={() => setMobilePanel("modules")}>Modules</Button>
            <Button variant={mobilePanel === "edit" ? "primary" : "secondary"} onClick={() => setMobilePanel("edit")}>Edition</Button>
          </div>

          <div className={`rounded-2xl border border-[#e8eaf3] bg-white/90 p-3 dark:border-white/10 dark:bg-[#151515] xl:hidden ${mobilePanel !== "meta" ? "hidden" : ""}`}>
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

          <div className={`rounded-2xl border border-[#e8eaf3] bg-white/90 p-3 dark:border-white/10 dark:bg-[#151515] xl:hidden ${mobilePanel !== "edit" ? "hidden" : ""}`}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t("editor.moduleEdit")}</p>
            <div className="mb-3 rounded-2xl border border-[#e8eaf3] bg-[#fafbff] p-3 dark:border-white/10 dark:bg-[#101114]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("editor.pageLabel")}</p>
                  <p className="mt-1 text-xs text-slate-500">Position du module actif</p>
                </div>
                <select
                  aria-label="page-selector-mobile"
                  className="h-9 min-w-[110px] rounded-xl border border-slate-300 bg-white px-2 text-xs dark:border-white/10 dark:bg-[#101010]"
                  value={selectedModule.layout.desktop.page}
                  onChange={(event) => updateSelectedModulePage(Number(event.target.value))}
                >
                  {Array.from({ length: pageCount }, (_, pageIndex) => (
                    <option key={pageIndex} value={pageIndex}>
                      {t("editor.page", { count: pageIndex + 1 })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {teamModeEnabled && definedTeams.length > 0 ? (
              <div className="mb-3 rounded-2xl border border-[#e8eaf3] bg-[#fafbff] p-3 dark:border-white/10 dark:bg-[#101114]">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("editor.audienceTags")}</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    className={`rounded-full border px-2 py-1 text-[11px] ${
                      selectedAudienceTeams.length === 0
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-900/20 dark:text-emerald-300"
                        : "border-[#d9dcea] bg-white text-slate-600 dark:border-white/10 dark:bg-[#101010] dark:text-slate-300"
                    }`}
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        modules: {
                          ...prev.modules,
                          [prev.selectedModuleKey]: {
                            ...prev.modules[prev.selectedModuleKey],
                            audience: {
                              ...prev.modules[prev.selectedModuleKey].audience,
                              mode: "all",
                              teams: []
                            }
                          }
                        }
                      }))
                    }
                  >
                    {t("editor.allTeams")}
                  </button>
                  {definedTeams.map((team) => {
                    const selected = selectedAudienceTeams.some((value) => value.toLowerCase() === team.toLowerCase());
                    return (
                      <button
                        key={team}
                        type="button"
                        className={`rounded-full border px-2 py-1 text-[11px] ${
                          selected
                            ? "border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-900/20 dark:text-brand-300"
                            : "border-[#d9dcea] bg-white text-slate-600 dark:border-white/10 dark:bg-[#101010] dark:text-slate-300"
                        }`}
                        onClick={() => toggleTeamForSelectedModule(team)}
                      >
                        {team}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
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

          <div className="hidden xl:block">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("editor.moduleEdit")}</p>
            <div className="mb-3 rounded-2xl border border-[#e8eaf3] bg-[#fafbff] p-3 dark:border-white/10 dark:bg-[#101114]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("editor.pageLabel")}</p>
                  <p className="mt-1 text-xs text-slate-500">Le module actif est rattaché à une page.</p>
                </div>
                <select
                  aria-label="page-selector-desktop"
                  className="h-9 min-w-[110px] rounded-xl border border-slate-300 bg-white px-2 text-xs dark:border-white/10 dark:bg-[#101010]"
                  value={selectedModule.layout.desktop.page}
                  onChange={(event) => updateSelectedModulePage(Number(event.target.value))}
                >
                  {Array.from({ length: pageCount }, (_, pageIndex) => (
                    <option key={pageIndex} value={pageIndex}>
                      {t("editor.page", { count: pageIndex + 1 })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {teamModeEnabled && definedTeams.length > 0 ? (
              <div className="mb-3 rounded-2xl border border-[#e8eaf3] bg-[#fafbff] p-3 dark:border-white/10 dark:bg-[#101114]">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("editor.audienceTags")}</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    className={`rounded-full border px-2 py-1 text-[11px] ${
                      selectedAudienceTeams.length === 0
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-900/20 dark:text-emerald-300"
                        : "border-[#d9dcea] bg-white text-slate-600 dark:border-white/10 dark:bg-[#101010] dark:text-slate-300"
                    }`}
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        modules: {
                          ...prev.modules,
                          [prev.selectedModuleKey]: {
                            ...prev.modules[prev.selectedModuleKey],
                            audience: {
                              ...prev.modules[prev.selectedModuleKey].audience,
                              mode: "all",
                              teams: []
                            }
                          }
                        }
                      }))
                    }
                  >
                    {t("editor.allTeams")}
                  </button>
                  {definedTeams.map((team) => {
                    const selected = selectedAudienceTeams.some((value) => value.toLowerCase() === team.toLowerCase());
                    return (
                      <button
                        key={team}
                        type="button"
                        className={`rounded-full border px-2 py-1 text-[11px] ${
                          selected
                            ? "border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-900/20 dark:text-brand-300"
                            : "border-[#d9dcea] bg-white text-slate-600 dark:border-white/10 dark:bg-[#101010] dark:text-slate-300"
                        }`}
                        onClick={() => toggleTeamForSelectedModule(team)}
                      >
                        {team}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <div className="rounded-2xl border border-[#e8eaf3] bg-white/90 p-3 dark:border-white/10 dark:bg-[#151515]">
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
          </div>

          <div className={`rounded-2xl border border-[#e8eaf3] bg-white/90 p-3 dark:border-white/10 dark:bg-[#151515] xl:hidden ${mobilePanel !== "modules" ? "hidden" : ""}`}>
            <ModuleList
              state={state}
              selected={state.selectedModuleKey}
              onSelect={(key) => {
                setState((prev) => ({ ...prev, selectedModuleKey: key }));
                setMobilePanel("edit");
              }}
              onToggle={(key, enabled) =>
                setState((prev) => ({
                  ...prev,
                  modules: normalizeLayouts({
                    ...prev.modules,
                    [key]: {
                      ...prev.modules[key],
                      enabled,
                      metadata: { ...prev.modules[key].metadata, enabled }
                    }
                  })
                }))
              }
            />
          </div>
        </Card>

        <Card className="flex justify-center border-[#e6ebf5] bg-[radial-gradient(circle_at_top,_rgba(235,240,250,0.95),_rgba(244,247,252,0.92)_30%,_rgba(238,242,248,0.95)_100%)] p-3 shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#101115]">
        <div className="a4-frame w-full max-w-[820px] space-y-3 rounded-xl border border-slate-200 bg-white p-1.5 shadow-panel dark:border-slate-700 dark:bg-slate-900">
          {visibleModulesByPage.map(({ pageIndex, items }) => (
            <div key={pageIndex} className="group space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {t("editor.page", { count: pageIndex + 1 })}
                </p>
                <div className="flex items-center gap-2">
                  {pageIndex === selectedModule.layout.desktop.page ? (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700 dark:bg-brand-900/20 dark:text-brand-300">
                      {t("briefings.pageCurrent")}
                    </span>
                  ) : null}
                  {pageCount > 1 ? (
                    <button
                      type="button"
                      aria-label={`Supprimer la page ${pageIndex + 1}`}
                      onClick={() => handleRemovePage(pageIndex)}
                      className="opacity-0 transition group-hover:opacity-100 rounded-full border border-[#d9deeb] bg-white/90 p-1 text-slate-500 hover:text-red-600 dark:border-white/10 dark:bg-[#171717]"
                    >
                      <X size={12} />
                    </button>
                  ) : null}
                </div>
              </div>
              <div
                ref={(node) => {
                  canvasRefs.current[pageIndex] = node;
                }}
                className="relative mx-auto aspect-[210/297] w-full touch-none overflow-hidden rounded-[28px] border border-[#edf1f7] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0f0f10]"
              >
                {items.map((entry) => {
                  const module = state.modules[entry.key];
                  const style = toCanvasStyle(module.layout);
                  const isSelected = state.selectedModuleKey === entry.key;
                  const isActive = hoveredModuleKey === entry.key || isSelected;
                  const PreviewComponent = moduleRegistry[entry.key].PreviewComponent;

                  return (
                    <section
                      key={entry.key}
                      style={style}
                      className={`absolute touch-none overflow-hidden rounded-2xl border p-2 shadow-[0_8px_20px_rgba(15,23,42,0.07)] transition dark:bg-[#151515] ${
                        MODULE_TONE_CLASS[entry.key]
                      } ${
                        isActive ? "border-brand-500 ring-2 ring-brand-500/15" : "border-[#edf1f7] dark:border-white/10"
                      }`}
                      onMouseEnter={() => setHoveredModuleKey(entry.key)}
                      onMouseLeave={() => setHoveredModuleKey((prev) => (prev === entry.key ? null : prev))}
                      onClick={() => {
                        if (entry.key !== "metadata") {
                          setState((prev) => ({ ...prev, selectedModuleKey: entry.key as Exclude<ModuleKey, "metadata"> }));
                        }
                      }}
                    >
                      <p className="mb-0.5 truncate text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        {entry.labels[i18n.language === "fr" ? "fr" : "en"]}
                      </p>

                      <div className="max-h-[calc(100%-16px)] overflow-auto text-[11px]">
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

                      {isActive ? (
                        <>
                          <button
                            type="button"
                            aria-label={`move-${entry.key}`}
                            className="absolute left-1/2 top-0 z-20 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-slate-900 text-white shadow-[0_8px_18px_rgba(15,23,42,0.22)] md:h-4 md:w-4"
                            onPointerDown={(event) => startPointerInteraction(event, entry.key, pageIndex, "move")}
                          />

                          {RESIZE_HANDLES.map((handle) => (
                            <button
                              key={handle.key}
                              type="button"
                              aria-label={`resize-${entry.key}-${handle.key}`}
                              className={`absolute z-20 h-3.5 w-3.5 rounded-full border border-white bg-brand-500 shadow-[0_6px_12px_rgba(108,99,255,0.28)] md:h-3 md:w-3 ${handle.className}`}
                              style={{ cursor: handle.cursor }}
                              onPointerDown={(event) => startPointerInteraction(event, entry.key, pageIndex, "resize", handle.key)}
                            />
                          ))}
                        </>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="flex justify-center py-2">
            <button
              type="button"
              aria-label={t("editor.addPage")}
              onClick={handleAddPage}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d9deeb] bg-white text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/10 dark:bg-[#171717] dark:text-slate-200 dark:hover:bg-[#1f1f1f]"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </Card>

        <Card className="space-y-3 border-[#e6ebf5] bg-white/92 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#121212]">
          <div className="rounded-2xl border border-[#e8eaf3] bg-[#fafbff] p-3 dark:border-white/10 dark:bg-[#101114]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Team mode</p>
                <p className="mt-1 text-xs text-slate-500">Active le ciblage par équipe terrain.</p>
              </div>
              <button
                type="button"
                aria-label="toggle-team-mode"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    modules: {
                      ...prev.modules,
                      metadata: {
                        ...prev.modules.metadata,
                        data: {
                          ...prev.modules.metadata.data,
                          team_mode: !prev.modules.metadata.data.team_mode
                        }
                      }
                    }
                  }))
                }
                className={`inline-flex h-8 items-center rounded-full px-1 transition ${
                  teamModeEnabled ? "bg-brand-500" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span className={`h-6 w-6 rounded-full bg-white transition ${teamModeEnabled ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
            {teamModeEnabled && definedTeams.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {definedTeams.map((team) => (
                  <span
                    key={team}
                    className="rounded-full border border-brand-200 bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700 dark:border-brand-500/30 dark:bg-brand-900/20 dark:text-brand-300"
                  >
                    {team}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">Ajoute des teams dans les métadonnées pour cibler certains modules.</p>
            )}
          </div>

          <div className="hidden xl:block rounded-2xl border border-[#e8eaf3] bg-white/90 p-3 dark:border-white/10 dark:bg-[#151515]">
            <ModuleList
              state={state}
              selected={state.selectedModuleKey}
              onSelect={(key) => {
                setState((prev) => ({ ...prev, selectedModuleKey: key }));
                setMobilePanel("edit");
              }}
              onToggle={(key, enabled) =>
                setState((prev) => ({
                  ...prev,
                  modules: normalizeLayouts({
                    ...prev.modules,
                    [key]: {
                      ...prev.modules[key],
                      enabled,
                      metadata: { ...prev.modules[key].metadata, enabled }
                    }
                  })
                }))
              }
            />
          </div>

          <div className="flex items-center gap-2 border-t border-[#edf1f7] pt-2 dark:border-white/10">
            <Button variant="secondary" onClick={() => void handlePdf()} disabled={pdfButtonState === "creating" || pdfButtonState === "generating"}>
              {pdfButtonState === "creating" || pdfButtonState === "generating" ? <Loader2 size={14} className="animate-spin" /> : null}
              {pdfButtonState === "ready" ? <Check size={14} /> : null}
              {pdfButtonState === "idle"
                ? t("editor.pdf")
                : pdfButtonState === "creating"
                  ? "Création..."
                  : pdfButtonState === "generating"
                    ? t("editor.loadingShort")
                    : pdfButtonState === "failed"
                      ? "Réessayer"
                      : t("editor.ready")}
            </Button>
            <Button variant="secondary" onClick={() => setShareOpen(true)}>
              <Share2 size={14} />
              {t("editor.share")}
            </Button>
            <span className="ml-auto text-xs text-slate-500">
              {saveIndicator === "saving" ? t("editor.saving") : saveIndicator === "saved" ? t("editor.savedShort") : ""}
            </span>
          </div>
        </Card>
      </div>
      <SharePanel
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        briefingId={briefing.id}
        teams={teamModeEnabled ? definedTeams : []}
        selectedTeam={null}
        onExportPdf={() => {
          window.location.assign(`/briefings/${briefing.id}/export`);
        }}
      />
    </div>
  );
}
