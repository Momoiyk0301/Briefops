import { PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { PencilLine, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { patchBriefing, toApiMessage, upsertBriefingModules } from "@/lib/api";
import { GridRect, ResizeHandle, tryMoveModuleRect, tryResizeModuleRect } from "@/lib/moduleLayout";
import { parseModuleRow, toCanonicalModuleJson } from "@/lib/moduleCanonical";
import { moduleEntries, moduleRegistry } from "@/lib/moduleRegistry";
import { Briefing, BriefingModuleRow, EditorState, ModuleDataMap, ModuleKey, RegistryModule } from "@/lib/types";
import { ContactForm } from "@/components/briefing/forms/ContactForm";
import { ModulePanel } from "@/components/briefing/ModulePanel";
import { SharePanel } from "@/components/briefing/SharePanel";
import { MetadataPreview } from "@/components/briefing/preview/MetadataPreview";
import { DateInput } from "@/components/input/date";
import { TelephoneInput } from "@/components/input/telephone";
import { TextAreaInput, TextInput } from "@/components/input/text";
import { ActionDropdownButton } from "@/components/ui/ActionDropdownButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Toggle } from "@/components/ui/Toggle";

const CANVAS_COLS = 12;
const CANVAS_ROWS = 24;
const EDITOR_MODULE_KEYS = ["access", "staff", "equipment", "delivery", "vehicle", "notes", "metadata"] as const;

type EditorModuleKey = (typeof EDITOR_MODULE_KEYS)[number];
type EditorTabKey = "general" | EditorModuleKey;
type TeamScope = "all" | string;

function rectTouchesOrOverlaps(a: GridRect, b: GridRect) {
  if ((a.page ?? 0) !== (b.page ?? 0)) return false;
  return a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y;
}

function normalizeLayouts(modules: EditorState["modules"]) {
  const placed: GridRect[] = [];
  const next = { ...modules } as Record<ModuleKey, EditorState["modules"][ModuleKey]>;

  moduleEntries.forEach((entry, index) => {
    const current = next[entry.key];
    if (!current.enabled || entry.key === "contact") return;

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

function getDefaultSelectedModule(modules: EditorState["modules"]): Exclude<ModuleKey, "metadata"> {
  const fallback = moduleEntries.find((entry) => entry.key !== "metadata" && entry.key !== "contact" && modules[entry.key].enabled)?.key;
  return (fallback ?? "access") as Exclude<ModuleKey, "metadata">;
}

function getVisibleTabs(modules: EditorState["modules"]): EditorTabKey[] {
  return ["general", ...EDITOR_MODULE_KEYS.filter((key) => modules[key].enabled)];
}

function getTabLabel(tab: EditorTabKey, language: string) {
  if (tab === "general") return "General";
  const locale = language === "fr" ? "fr" : "en";
  if (tab === "delivery") return language === "fr" ? "Livraisons" : "Deliveries";
  if (tab === "vehicle") return language === "fr" ? "Véhicules" : "Vehicles";
  return moduleRegistry[tab].labels[locale];
}

export function buildInitialState(briefing: Briefing, rows: BriefingModuleRow[], registryModules: RegistryModule[] = []): EditorState {
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

  return {
    core: {
      title: briefing.title,
      event_date: briefing.event_date,
      location_text: briefing.location_text ?? ""
    },
    selectedModuleKey: getDefaultSelectedModule(modules),
    modules
  };
}

type Props = {
  briefing: Briefing;
  modules: BriefingModuleRow[];
  registryModules?: RegistryModule[];
  saveNonce?: number;
};

function GeneralTab({
  state,
  onCoreChange,
  onMetadataChange
}: {
  state: EditorState;
  onCoreChange: (patch: Partial<EditorState["core"]>) => void;
  onMetadataChange: (patch: Partial<EditorState["modules"]["metadata"]["data"]>) => void;
}) {
  const metadata = state.modules.metadata.data;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-[#e6ebf5] bg-white/92 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#121212]">
        <div className="grid gap-3">
          <TextInput label="Event name" placeholder="Event name" value={state.core.title} onChange={(event) => onCoreChange({ title: event.target.value })} />
          <DateInput label="Date" value={state.core.event_date ?? ""} onChange={(event) => onCoreChange({ event_date: event.target.value || null })} />
          <TextInput label="Location" placeholder="Location" value={state.core.location_text} onChange={(event) => onCoreChange({ location_text: event.target.value })} />
        </div>
      </Card>

      <Card className="border-[#e6ebf5] bg-white/92 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#121212]">
        <div className="grid gap-3">
          <TextInput label="Contact" placeholder="Main contact" value={metadata.main_contact_name} onChange={(event) => onMetadataChange({ main_contact_name: event.target.value })} />
          <TelephoneInput label="Phone" placeholder="Phone" value={metadata.main_contact_phone} onChange={(event) => onMetadataChange({ main_contact_phone: event.target.value })} />
          <TextAreaInput label="Global notes" placeholder="Global notes" rows={6} value={metadata.global_notes} onChange={(event) => onMetadataChange({ global_notes: event.target.value })} />
        </div>
      </Card>
    </div>
  );
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

const MODULE_TONE_CLASS: Record<EditorModuleKey, string> = {
  metadata: "border-sky-200/90 bg-sky-50/80",
  access: "border-emerald-200/90 bg-emerald-50/80",
  delivery: "border-amber-200/90 bg-amber-50/80",
  vehicle: "border-violet-200/90 bg-violet-50/80",
  equipment: "border-cyan-200/90 bg-cyan-50/80",
  staff: "border-rose-200/90 bg-rose-50/80",
  notes: "border-indigo-200/90 bg-indigo-50/80"
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

export function BriefingEditor({ briefing, modules, registryModules = [], saveNonce = 0 }: Props) {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState<EditorState>(() => buildInitialState(briefing, modules, registryModules));
  const [selectedTab, setSelectedTab] = useState<EditorTabKey>("general");
  const [visualEditor, setVisualEditor] = useState(false);
  const [shareScope, setShareScope] = useState<TeamScope>("all");
  const [exportScope, setExportScope] = useState<TeamScope>("all");
  const [teamDraft, setTeamDraft] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [hoveredModuleKey, setHoveredModuleKey] = useState<EditorModuleKey | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState<"hidden" | "saving" | "saved">("hidden");
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

  const definedTeams = state.modules.metadata.data.teams;
  const teamModeEnabled = state.modules.metadata.data.team_mode;

  useEffect(() => {
    const visibleTabs = getVisibleTabs(state.modules);
    if (!visibleTabs.includes(selectedTab)) setSelectedTab("general");
  }, [selectedTab, state.modules]);

  useEffect(() => {
    setState((prev) => {
      let changed = false;
      const nextModules = { ...prev.modules } as EditorState["modules"];
      const teamSet = new Set(definedTeams.map((team) => team.toLowerCase()));

      (Object.keys(prev.modules) as ModuleKey[])
        .filter((key) => key !== "contact")
        .forEach((key) => {
          const module = prev.modules[key];
          const filteredTeams = module.audience.teams.filter((team) => teamSet.has(team.toLowerCase()));
          const nextMode = teamModeEnabled && filteredTeams.length > 0 ? "teams" : "all";

          if (nextMode !== module.audience.mode || filteredTeams.length !== module.audience.teams.length) {
            changed = true;
            (nextModules as Record<ModuleKey, EditorState["modules"][ModuleKey]>)[key] = {
              ...module,
              audience: { ...module.audience, mode: nextMode, teams: filteredTeams }
            };
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
    }
  };

  useEffect(() => {
    if (!saveNonce) return;
    void handleSave(true);
  }, [saveNonce]);

  const updateModuleData = <K extends ModuleKey>(key: K, data: ModuleDataMap[K]) => {
    setState((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [key]: { ...prev.modules[key], data }
      }
    }));
  };

  const updateModuleEnabled = (key: EditorModuleKey, enabled: boolean) => {
    setState((prev) => {
      const nextModules = normalizeLayouts({
        ...prev.modules,
        [key]: {
          ...prev.modules[key],
          enabled,
          metadata: { ...prev.modules[key].metadata, enabled }
        }
      });

      return {
        ...prev,
        selectedModuleKey: prev.selectedModuleKey === key && !enabled ? getDefaultSelectedModule(nextModules) : prev.selectedModuleKey,
        modules: nextModules
      };
    });

    if (selectedTab === key && !enabled) setSelectedTab("general");
  };

  const addTeam = () => {
    const nextTeam = teamDraft.trim();
    if (!nextTeam) return;
    if (definedTeams.some((team) => team.toLowerCase() === nextTeam.toLowerCase())) {
      setTeamDraft("");
      return;
    }

    setState((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        metadata: {
          ...prev.modules.metadata,
          data: {
            ...prev.modules.metadata.data,
            teams: [...prev.modules.metadata.data.teams, nextTeam],
            team_mode: true
          }
        }
      }
    }));
    setTeamDraft("");
  };

  const removeTeam = (teamToRemove: string) => {
    setState((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        metadata: {
          ...prev.modules.metadata,
          data: {
            ...prev.modules.metadata.data,
            teams: prev.modules.metadata.data.teams.filter((team) => team !== teamToRemove)
          }
        }
      }
    }));
  };

  const startPointerInteraction = (event: ReactPointerEvent, key: EditorModuleKey, page: number, mode: "move" | "resize", handle?: ResizeHandle) => {
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
    const others = EDITOR_MODULE_KEYS
      .filter((otherKey) => otherKey !== key && state.modules[otherKey].enabled && state.modules[otherKey].layout.desktop.page === page)
      .map((otherKey) => state.modules[otherKey].layout.desktop);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = Math.round((moveEvent.clientX - startX) / cellW);
      const deltaY = Math.round((moveEvent.clientY - startY) / cellH);
      if (deltaX === 0 && deltaY === 0) return;

      const nextRect =
        mode === "move"
          ? tryMoveModuleRect({ current: initialRect, others, deltaX, deltaY, cols: CANVAS_COLS, rows: CANVAS_ROWS })
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
            layout: { ...prev.modules[key].layout, desktop: { ...nextRect, page } }
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

  const visibleTabs = getVisibleTabs(state.modules);
  const filteredLibraryEntries = EDITOR_MODULE_KEYS.filter((key) => {
    const q = librarySearch.trim().toLowerCase();
    if (!q) return true;
    const locale = i18n.language === "fr" ? "fr" : "en";
    const label = getTabLabel(key, i18n.language).toLowerCase();
    const description = moduleRegistry[key].description[locale].toLowerCase();
    return label.includes(q) || description.includes(q);
  });

  const selectedConfigModuleKey = selectedTab === "general" ? null : selectedTab;
  const selectedConfigModule = selectedConfigModuleKey ? state.modules[selectedConfigModuleKey] : null;
  const pageCount = Math.max(1, ...EDITOR_MODULE_KEYS.filter((key) => state.modules[key].enabled).map((key) => state.modules[key].layout.desktop.page + 1));
  const visibleModulesByPage = useMemo(
    () => Array.from({ length: pageCount }, (_, pageIndex) => ({ pageIndex, items: EDITOR_MODULE_KEYS.filter((key) => state.modules[key].enabled && state.modules[key].layout.desktop.page === pageIndex) })),
    [pageCount, state.modules]
  );

  const updateAudienceTeams = (teams: string[]) => {
    if (!selectedConfigModuleKey) return;
    setState((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [selectedConfigModuleKey]: {
          ...prev.modules[selectedConfigModuleKey],
          audience: {
            ...prev.modules[selectedConfigModuleKey].audience,
            mode: teams.length > 0 ? "teams" : "all",
            teams
          }
        }
      }
    }));
  };

  const renderTabPanel = () => {
    if (selectedTab === "general") {
      return (
        <GeneralTab
          state={state}
          onCoreChange={(patch) => setState((prev) => ({ ...prev, core: { ...prev.core, ...patch } }))}
          onMetadataChange={(patch) =>
            setState((prev) => ({
              ...prev,
              modules: {
                ...prev.modules,
                metadata: { ...prev.modules.metadata, data: { ...prev.modules.metadata.data, ...patch } }
              }
            }))
          }
        />
      );
    }

    if (selectedTab === "metadata") {
      return (
        <div className="space-y-4">
          <Card className="border-[#e6ebf5] bg-white/92 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#121212]">
            <p className="text-sm font-semibold text-[#172033] dark:text-white">Operational metadata</p>
            <p className="mt-1 text-sm text-slate-500">Team mode and team targeting are managed in the configuration panel.</p>
            <div className="mt-4 rounded-2xl border border-[#e8eaf3] bg-[#fafbff] p-4 dark:border-white/10 dark:bg-[#101114]">
              <MetadataPreview title={state.core.title} eventDate={state.core.event_date} location={state.core.location_text} metadata={state.modules.metadata.data} />
            </div>
          </Card>
          <Card className="border-[#e6ebf5] bg-white/92 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#121212]">
            <p className="mb-4 text-sm font-semibold text-[#172033] dark:text-white">Project contacts</p>
            <ContactForm value={state.modules.contact.data} onChange={(value) => updateModuleData("contact", value)} />
          </Card>
        </div>
      );
    }

    return (
      <Card className="border-[#e6ebf5] bg-white/92 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#121212]">
        <ModulePanel state={state} selected={selectedTab} onChange={updateModuleData} />
      </Card>
    );
  };

  const scopeOptions = (currentScope: TeamScope, setScope: (scope: TeamScope) => void, verb: string) => {
    const base = [{ label: "Toutes les équipes", description: `${verb} sans filtre équipe`, onSelect: () => setScope("all") }];
    if (!teamModeEnabled) return base;
    return [
      ...base,
      ...definedTeams.map((team) => ({
        label: team,
        description: currentScope === team ? "Filtre actif" : `${verb} avec le filtre ${team}`,
        onSelect: () => setScope(team)
      }))
    ];
  };

  return (
    <div className="space-y-4">
      <Card className="border-[#dde4f1] bg-white/92 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#121212]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 rounded-[24px] border border-[#e8eaf3] bg-[#f8faff] px-4 py-3 dark:border-white/10 dark:bg-[#101114]">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${visualEditor ? "bg-brand-500 text-white" : "bg-white text-[#6f7892] dark:bg-[#171717] dark:text-[#cfd6e7]"}`}>
                  <PencilLine size={16} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#172033] dark:text-white">Custom Layout</p>
                  <p className="text-xs text-slate-500">Inputs classiques ou édition directe dans l’aperçu.</p>
                </div>
                <Toggle checked={visualEditor} onChange={setVisualEditor} ariaLabel="toggle-visual-editor" />
              </div>

              <div className="flex items-center gap-3 rounded-[24px] border border-[#e8eaf3] bg-[#f8faff] px-4 py-3 dark:border-white/10 dark:bg-[#101114]">
                <div>
                  <p className="text-sm font-semibold text-[#172033] dark:text-white">Team Mode</p>
                  <p className="text-xs text-slate-500">Un module peut cibler plusieurs équipes.</p>
                </div>
                <Toggle
                  checked={teamModeEnabled}
                  ariaLabel="toggle-team-mode"
                  onChange={(value) =>
                    setState((prev) => ({
                      ...prev,
                      modules: {
                        ...prev.modules,
                        metadata: {
                          ...prev.modules.metadata,
                          data: { ...prev.modules.metadata.data, team_mode: value }
                        }
                      }
                    }))
                  }
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">{saveIndicator === "saving" ? t("editor.saving") : saveIndicator === "saved" ? t("editor.savedShort") : ""}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ActionDropdownButton label={shareScope === "all" ? "Partager" : `Partager · ${shareScope}`} icon={<Share2 size={15} />} onClick={() => setShareOpen(true)} options={scopeOptions(shareScope, setShareScope, "Partager")} />
            <ActionDropdownButton
              label={exportScope === "all" ? "PDF" : `PDF · ${exportScope}`}
              onClick={() => {
                const query = exportScope !== "all" ? `?team=${encodeURIComponent(exportScope)}` : "";
                window.location.assign(`/briefings/${briefing.id}/export${query}`);
              }}
              options={scopeOptions(exportScope, setExportScope, "Générer le PDF")}
            />
          </div>
        </div>
      </Card>

      <div className={`grid grid-cols-1 ${visualEditor ? "gap-3 xl:grid-cols-[minmax(0,1.35fr)_300px]" : "gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"}`}>
        <div className="space-y-4">
          {!visualEditor ? (
            <>
              <Card className="border-[#dde4f1] bg-white/92 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#121212]">
                <div className="flex gap-2 overflow-x-auto">
                  {visibleTabs.map((tab) => {
                    const active = selectedTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setSelectedTab(tab)}
                        className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-[#dde6f7] text-[#172033] dark:bg-white/10 dark:text-white" : "bg-transparent text-slate-500 hover:bg-[#f5f7fb] dark:text-slate-300 dark:hover:bg-white/5"}`}
                      >
                        {getTabLabel(tab, i18n.language)}
                      </button>
                    );
                  })}
                </div>
              </Card>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Editor</p>
                  <h2 className="mt-1 text-xl font-semibold text-[#172033] dark:text-white">{getTabLabel(selectedTab, i18n.language)}</h2>
                </div>
                {renderTabPanel()}
              </div>
            </>
          ) : (
            <Card className="border-[#e6ebf5] bg-[radial-gradient(circle_at_top,_rgba(235,240,250,0.95),_rgba(244,247,252,0.92)_30%,_rgba(238,242,248,0.95)_100%)] p-3 shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#101115]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Visual mode</p>
                  <p className="mt-1 text-sm text-slate-500">L’aperçu devient la zone d’édition principale.</p>
                </div>
                <p className="text-xs text-slate-500">Clique un bloc pour ajuster ses règles dans la sidebar.</p>
              </div>

              <div className="a4-frame a4-frame--wide w-full space-y-3 rounded-xl border border-slate-200 bg-white p-2 shadow-panel dark:border-slate-700 dark:bg-slate-900">
                {visibleModulesByPage.map(({ pageIndex, items }) => (
                  <div key={pageIndex} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Page {pageIndex + 1}</p>
                    </div>
                    <div
                      ref={(node) => {
                        canvasRefs.current[pageIndex] = node;
                      }}
                      className="relative mx-auto aspect-[210/297] w-full touch-none overflow-hidden rounded-[28px] border border-[#edf1f7] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0f0f10]"
                    >
                      {items.map((key) => {
                        const module = state.modules[key];
                        const style = toCanvasStyle(module.layout);
                        const isActive = hoveredModuleKey === key || selectedTab === key;
                        const FormComponent = key === "metadata" ? null : moduleRegistry[key].FormComponent;

                        return (
                          <section
                            key={key}
                            style={style}
                            className={`visual-editor-module absolute touch-none overflow-auto rounded-2xl border p-2 shadow-[0_8px_20px_rgba(15,23,42,0.07)] transition dark:bg-[#151515] ${MODULE_TONE_CLASS[key]} ${isActive ? "border-brand-500 ring-2 ring-brand-500/15" : "border-[#edf1f7] dark:border-white/10"}`}
                            onMouseEnter={() => setHoveredModuleKey(key)}
                            onMouseLeave={() => setHoveredModuleKey((prev) => (prev === key ? null : prev))}
                            onClick={() => setSelectedTab(key)}
                          >
                            <p className="mb-1 truncate text-[10px] font-semibold uppercase tracking-wide text-slate-600">{getTabLabel(key, i18n.language)}</p>
                            {key === "metadata" ? (
                              <div className="grid gap-2">
                                <TextInput placeholder="Event name" value={state.core.title} onChange={(event) => setState((prev) => ({ ...prev, core: { ...prev.core, title: event.target.value } }))} />
                                <DateInput value={state.core.event_date ?? ""} onChange={(event) => setState((prev) => ({ ...prev, core: { ...prev.core, event_date: event.target.value || null } }))} />
                                <TextInput placeholder="Location" value={state.core.location_text} onChange={(event) => setState((prev) => ({ ...prev, core: { ...prev.core, location_text: event.target.value } }))} />
                                <TextInput placeholder="Main contact" value={state.modules.metadata.data.main_contact_name} onChange={(event) => updateModuleData("metadata", { ...state.modules.metadata.data, main_contact_name: event.target.value })} />
                                <TelephoneInput placeholder="Phone" value={state.modules.metadata.data.main_contact_phone} onChange={(event) => updateModuleData("metadata", { ...state.modules.metadata.data, main_contact_phone: event.target.value })} />
                                <TextAreaInput rows={3} placeholder="Global notes" value={state.modules.metadata.data.global_notes} onChange={(event) => updateModuleData("metadata", { ...state.modules.metadata.data, global_notes: event.target.value })} />
                              </div>
                            ) : FormComponent ? (
                              <FormComponent value={module.data as never} onChange={(value) => updateModuleData(key, value as never)} />
                            ) : null}

                            {isActive ? (
                              <>
                                <button
                                  type="button"
                                  aria-label={`move-${key}`}
                                  className="absolute left-1/2 top-0 z-20 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-slate-900 text-white shadow-[0_8px_18px_rgba(15,23,42,0.22)] md:h-4 md:w-4"
                                  onPointerDown={(event) => startPointerInteraction(event, key, pageIndex, "move")}
                                />
                                {RESIZE_HANDLES.map((handle) => (
                                  <button
                                    key={handle.key}
                                    type="button"
                                    aria-label={`resize-${key}-${handle.key}`}
                                    className={`absolute z-20 h-3.5 w-3.5 rounded-full border border-white bg-brand-500 shadow-[0_6px_12px_rgba(108,99,255,0.28)] md:h-3 md:w-3 ${handle.className}`}
                                    style={{ cursor: handle.cursor }}
                                    onPointerDown={(event) => startPointerInteraction(event, key, pageIndex, "resize", handle.key)}
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
              </div>
            </Card>
          )}
        </div>

        <Card className="space-y-4 border-[#dde4f1] bg-white/92 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#121212]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Configuration</p>
            <h3 className="mt-1 text-lg font-semibold text-[#172033] dark:text-white">Réglages du module</h3>
          </div>

          <div className="rounded-2xl border border-[#e8eaf3] bg-[#fafbff] p-4 dark:border-white/10 dark:bg-[#101114]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Module settings</p>
            {selectedConfigModule && selectedConfigModuleKey ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Team</p>
                  {!teamModeEnabled || definedTeams.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">Active Team Mode puis ajoute des équipes pour cibler ce module.</p>
                  ) : (
                    <div className="mt-2">
                      <MultiSelect
                        label="Visible pour"
                        options={definedTeams}
                        value={selectedConfigModule.audience.teams}
                        onChange={updateAudienceTeams}
                        emptyText="Toutes les équipes"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">General est toujours visible. Active un module pour régler sa visibilité d’équipe.</p>
            )}
          </div>

          <div className="rounded-2xl border border-[#e8eaf3] bg-white/90 p-4 dark:border-white/10 dark:bg-[#151515]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Teams</p>
              <p className="mt-1 text-sm text-slate-500">Liste de référence pour le multiselect des modules.</p>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Input
                placeholder="Add a team"
                value={teamDraft}
                onChange={(event) => setTeamDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTeam();
                  }
                }}
              />
              <Button variant="secondary" className="px-3" onClick={addTeam}>
                Ajouter
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {definedTeams.length === 0 ? (
                <p className="text-sm text-slate-500">No team yet.</p>
              ) : (
                definedTeams.map((team) => (
                  <button key={team} type="button" className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 dark:border-brand-500/30 dark:bg-brand-900/20 dark:text-brand-300" onClick={() => removeTeam(team)}>
                    {team} x
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#e8eaf3] bg-white/90 p-4 dark:border-white/10 dark:bg-[#151515]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Module library</p>
            <div className="mt-4 space-y-2">
              <Input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder={i18n.language === "fr" ? "Rechercher un module..." : "Search module..."} />
              {filteredLibraryEntries.map((key) => {
                const enabled = state.modules[key].enabled;
                const selected = selectedTab === key;

                return (
                  <div
                    key={key}
                    role="button"
                    tabIndex={0}
                    onClick={() => enabled && setSelectedTab(key)}
                    onKeyDown={(event) => {
                      if ((event.key === "Enter" || event.key === " ") && enabled) {
                        event.preventDefault();
                        setSelectedTab(key);
                      }
                    }}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 transition ${selected ? "border-brand-500 bg-brand-500/10" : enabled ? "border-brand-500/30 bg-brand-500/5" : "border-[#e8eaf3] bg-white dark:border-white/10 dark:bg-[#101010]"}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#172033] dark:text-white">{getTabLabel(key, i18n.language)}</p>
                      <p className="truncate text-xs text-slate-500">{moduleRegistry[key].description[i18n.language === "fr" ? "fr" : "en"]}</p>
                    </div>
                    <div onClick={(event) => event.stopPropagation()}>
                      <Toggle checked={enabled} onChange={(value) => updateModuleEnabled(key, value)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <SharePanel
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        briefingId={briefing.id}
        teams={teamModeEnabled ? definedTeams : []}
        selectedTeam={teamModeEnabled && shareScope !== "all" ? shareScope : null}
        onExportPdf={(team) => {
          const query = team ? `?team=${encodeURIComponent(team)}` : "";
          window.location.assign(`/briefings/${briefing.id}/export${query}`);
        }}
      />
    </div>
  );
}
