import { PointerEvent as ReactPointerEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, FileText, LayoutGrid, Loader2, Settings2, Share2, SlidersHorizontal, User } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { generateBriefingPdf, getStorageSignedUrl, patchBriefing, toApiMessage, upsertBriefingModules } from "@/lib/api";
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
import { Toggle } from "@/components/ui/Toggle";

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
          settings: parsed.settings,
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
      title: briefing.title ?? "",
      event_date: briefing.event_date ?? null,
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

type SidebarTab = "content" | "modules" | "settings";

function SidebarTabButton({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 border-b-2 px-1 pb-3 pt-1 text-sm font-semibold transition ${
        active
          ? "border-brand-500 text-[#172033] dark:text-white"
          : "border-transparent text-[#737b92] hover:text-[#172033] dark:text-[#a8afc6] dark:hover:text-white"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SidebarDisclosure({
  title,
  description,
  icon,
  defaultOpen = false,
  children
}: {
  title: string;
  description?: string;
  icon: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-[22px] border border-[#dfe5f0] bg-white/96 shadow-sm dark:border-white/10 dark:bg-[#161616]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7d849a] dark:text-[#98a0b7]">
            {icon}
            <span>{title}</span>
          </div>
          {description ? (
            <p className="mt-1 text-sm text-[#6f7890] dark:text-[#a9b0c6]">{description}</p>
          ) : null}
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[#8890a6] transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? <div className="border-t border-[#e8edf5] px-4 py-4 dark:border-white/10">{children}</div> : null}
    </section>
  );
}

export function BriefingEditor({ briefing, modules, registryModules = [] }: Props) {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState<EditorState>(() => buildInitialState(briefing, modules, registryModules));
  const [saving, setSaving] = useState(false);
  const [hoveredModuleKey, setHoveredModuleKey] = useState<ModuleKey | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("content");
  const [pdfButtonState, setPdfButtonState] = useState<"idle" | "loading" | "ready">("idle");
  const [shareOpen, setShareOpen] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState<"hidden" | "saving" | "saved" | "timestamp">("hidden");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfPath, setPdfPath] = useState<string | null>(briefing.pdf_path ?? null);
  const [pdfFilename, setPdfFilename] = useState<string | null>(briefing.pdf_path?.split("/").pop() ?? null);
  const [teamPdfPaths, setTeamPdfPaths] = useState<Record<string, string>>({});
  const [teamPdfFiles, setTeamPdfFiles] = useState<Record<string, { path: string; url: string; filename: string }>>({});
  const [selectedPdfTeam, setSelectedPdfTeam] = useState<string>("all");
  const [showPreviewAnchors, setShowPreviewAnchors] = useState(true);
  const [pageCountOverride, setPageCountOverride] = useState<number>(() => getEnabledPageCount(buildInitialState(briefing, modules, registryModules).modules));
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const canvasRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const lastSaved = useRef("");
  const saveIndicatorTimeoutRef = useRef<number | null>(null);

  const setSavedIndicator = (savedAt: Date) => {
    setLastSavedAt(savedAt.toISOString());
    setSaveIndicator("saved");

    if (saveIndicatorTimeoutRef.current) {
      window.clearTimeout(saveIndicatorTimeoutRef.current);
    }

    saveIndicatorTimeoutRef.current = window.setTimeout(() => {
      setSaveIndicator("timestamp");
      saveIndicatorTimeoutRef.current = null;
    }, 1200);
  };

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

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!briefing.pdf_path) return;
      try {
        const signedUrl = await getStorageSignedUrl("exports", briefing.pdf_path, 3600);
        if (!cancelled) {
          setPdfUrl(signedUrl);
          setPdfPath(briefing.pdf_path);
          setPdfFilename(briefing.pdf_path.split("/").pop() ?? "briefing.pdf");
          setPdfButtonState("ready");
        }
      } catch {
        if (!cancelled) setPdfUrl(null);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [briefing.pdf_path]);

  useEffect(() => {
    return () => {
      if (saveIndicatorTimeoutRef.current) {
        window.clearTimeout(saveIndicatorTimeoutRef.current);
      }
    };
  }, []);

  const teamModeEnabled = state.modules.metadata.data.team_mode;
  const definedTeams = state.modules.metadata.data.teams;

  useEffect(() => {
    if (!teamModeEnabled) {
      if (selectedPdfTeam !== "all") setSelectedPdfTeam("all");
      return;
    }
    if (selectedPdfTeam === "all") return;
    const stillExists = definedTeams.some((team) => team.toLowerCase() === selectedPdfTeam.toLowerCase());
    if (!stillExists) setSelectedPdfTeam("all");
  }, [definedTeams, selectedPdfTeam, teamModeEnabled]);

  useEffect(() => {
    if (pdfButtonState === "loading") return;
    if (selectedPdfTeam === "all") {
      setPdfButtonState(pdfPath || pdfUrl ? "ready" : "idle");
      return;
    }
    setPdfButtonState(teamPdfFiles[selectedPdfTeam] ? "ready" : "idle");
  }, [pdfButtonState, pdfPath, pdfUrl, selectedPdfTeam, teamPdfFiles]);

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
        settings: state.modules[key].settings,
        values: state.modules[key].data as Record<string, unknown>,
        data_json: toCanonicalModuleJson({
          key,
          moduleId: state.modules[key].module_id ?? null,
          metadata: { ...state.modules[key].metadata, enabled: state.modules[key].enabled },
          audience: state.modules[key].audience,
          layout: state.modules[key].layout,
          settings: state.modules[key].settings,
          data: state.modules[key].data
        })
      })),
    [state.modules]
  );

  const handleSave = async (_manual = true) => {
    try {
      setSaving(true);
      setSaveIndicator("saving");
      await patchBriefing(briefing.id, {
        title: state.core.title,
        event_date: state.core.event_date,
        location_text: state.core.location_text
      });
      await upsertBriefingModules(briefing.id, payload);
      lastSaved.current = JSON.stringify(state);
      setSavedIndicator(new Date());
    } catch (error) {
      setSaveIndicator(lastSavedAt ? "timestamp" : "hidden");
      toast.error(`${t("editor.saveError")}: ${toApiMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const downloadGeneratedPdf = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePdf = async () => {
    const targetTeam = teamModeEnabled && selectedPdfTeam !== "all" ? selectedPdfTeam : null;
    const readyTeamFile = targetTeam ? teamPdfFiles[targetTeam] ?? null : null;
    const readyFile = targetTeam
      ? readyTeamFile
      : pdfUrl && pdfFilename
        ? { url: pdfUrl, filename: pdfFilename }
        : null;

    if (pdfButtonState === "ready" && readyFile) {
      try {
        if (!targetTeam && pdfPath) {
          const signedUrl = await getStorageSignedUrl("exports", pdfPath, 3600);
          setPdfUrl(signedUrl);
          downloadGeneratedPdf(signedUrl, pdfFilename ?? "briefing.pdf");
          return;
        }
        if (targetTeam && readyTeamFile?.path) {
          const signedUrl = await getStorageSignedUrl("exports", readyTeamFile.path, 3600);
          setTeamPdfFiles((prev) => ({
            ...prev,
            [targetTeam]: {
              ...readyTeamFile,
              url: signedUrl
            }
          }));
          downloadGeneratedPdf(signedUrl, readyTeamFile.filename);
          return;
        }
        if (readyFile.url) {
          downloadGeneratedPdf(readyFile.url, readyFile.filename);
          return;
        }
      } catch (error) {
        toast.error(toApiMessage(error));
      }
    }

    const toastId = toast.loading(
      targetTeam ? t("editor.pdfGeneratingTeam", { team: targetTeam }) : t("editor.pdfGenerating")
    );
    let generated = false;
    try {
      setPdfButtonState("loading");
      const result = await generateBriefingPdf(briefing.id, targetTeam);
      if (targetTeam) {
        setTeamPdfPaths((prev) => ({
          ...prev,
          [targetTeam]: result.pdf_path
        }));
        setTeamPdfFiles((prev) => ({
          ...prev,
          [targetTeam]: {
            path: result.pdf_path,
            url: result.pdf_url,
            filename: result.filename
          }
        }));
      } else {
        setPdfUrl(result.pdf_url);
        setPdfPath(result.pdf_path);
        setPdfFilename(result.filename);
      }
      setPdfButtonState("ready");
      generated = true;
      toast.success(targetTeam ? t("editor.pdfReadyTeam", { team: targetTeam }) : t("editor.pdfReady"), { id: toastId });
    } catch (error) {
      const msg = toApiMessage(error);
      toast.error(msg.includes("limit") ? t("editor.pdfDenied") : `${t("editor.pdfFailed")} ${msg}`, { id: toastId });
      setPdfButtonState("idle");
    } finally {
      if (!generated) setPdfButtonState("idle");
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
  const configurableModules = moduleEntries.filter((entry) => entry.key !== "metadata");
  const selectedModule = state.modules[state.selectedModuleKey];
  const selectedModuleEntry = moduleEntries.find((entry) => entry.key === state.selectedModuleKey);
  const selectedAudienceTeams = selectedModule.audience.teams;
  const pageCount = Math.max(pageCountOverride, getEnabledPageCount(state.modules));
  const saveStatusLabel = saveIndicator === "saving"
    ? t("editor.saving")
    : saveIndicator === "saved"
      ? t("editor.savedShort")
      : saveIndicator === "timestamp" && lastSavedAt
        ? t("editor.savedAt", {
            time: new Intl.DateTimeFormat(i18n.language === "fr" ? "fr-BE" : "en-US", {
              hour: "2-digit",
              minute: "2-digit"
            }).format(new Date(lastSavedAt))
          })
        : "";

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

  const updateMetadata = (core: EditorState["core"], metadata: EditorState["modules"]["metadata"]["data"]) => {
    setState((prev) => ({
      ...prev,
      core,
      modules: {
        ...prev.modules,
        metadata: { ...prev.modules.metadata, data: metadata }
      }
    }));
  };

  const setModuleEnabled = (key: ModuleKey, enabled: boolean) => {
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
    }));
  };

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.28fr)_332px]">
      <Card className="overflow-hidden border-[#dce4f3] bg-[linear-gradient(180deg,#f6f8fc_0%,#eef2fa_100%)] p-0 dark:border-white/10 dark:bg-[#111214]">
        <div className="border-b border-[#e2e7f2] bg-white/88 px-4 py-3 dark:border-white/10 dark:bg-[#161616]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#79819a] dark:text-[#8d97b0]">
                {t("editor.previewEyebrow")}
              </p>
              <h2 className="mt-1 truncate text-lg font-semibold text-[#172033] dark:text-white">
                {state.core.title || t("editor.untitled")}
              </h2>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-[#dbe3f1] bg-white/90 px-3 py-1.5 text-xs text-[#667089] shadow-sm dark:border-white/10 dark:bg-[#101010] dark:text-[#9da5bf] sm:flex">
              <LayoutGrid size={14} />
              <span>{t("editor.canvasHint")}</span>
            </div>
          </div>
        </div>

        <div className="p-2.5 sm:p-3">
          <div className="rounded-[28px] border border-[#dce4f1] bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fd_100%)] p-2.5 shadow-[0_26px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#151515]">
            <div className="a4-frame w-full space-y-3 rounded-[24px] border border-slate-200 bg-white p-3 shadow-panel dark:border-slate-700 dark:bg-slate-900">
              {visibleModulesByPage.map(({ pageIndex, items }) => (
                <div key={pageIndex} className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {t("editor.page", { count: pageIndex + 1 })}
                    </p>
                    {pageIndex === selectedModule.layout.desktop.page ? (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700 dark:bg-brand-900/20 dark:text-brand-300">
                        {t("briefings.pageCurrent")}
                      </span>
                    ) : null}
                  </div>
                  <div
                    ref={(node) => {
                      canvasRefs.current[pageIndex] = node;
                    }}
                    className="relative mx-auto aspect-[210/297] w-full touch-none overflow-hidden rounded-lg border border-[#e8eaf3] bg-white dark:border-white/10 dark:bg-[#0f0f10]"
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
                          className={`absolute touch-none overflow-hidden rounded-md border p-1.5 shadow-sm transition dark:bg-[#151515] ${
                            MODULE_TONE_CLASS[entry.key]
                          } ${
                            isActive ? "border-brand-500 ring-1 ring-brand-500/20" : "border-[#dfe3ef] dark:border-white/10"
                          }`}
                          onMouseEnter={() => setHoveredModuleKey(entry.key)}
                          onMouseLeave={() => setHoveredModuleKey((prev) => (prev === entry.key ? null : prev))}
                          onClick={() => {
                            if (entry.key !== "metadata") {
                              setState((prev) => ({ ...prev, selectedModuleKey: entry.key as Exclude<ModuleKey, "metadata"> }));
                              setSidebarTab("settings");
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

                          {showPreviewAnchors && isActive ? (
                            <>
                              <button
                                type="button"
                                aria-label={`move-${entry.key}`}
                                className="absolute left-1/2 top-0 z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-500 bg-cyan-400 shadow md:h-3 md:w-3"
                                onPointerDown={(event) => startPointerInteraction(event, entry.key, pageIndex, "move")}
                              />

                              {RESIZE_HANDLES.map((handle) => (
                                <button
                                  key={handle.key}
                                  type="button"
                                  aria-label={`resize-${entry.key}-${handle.key}`}
                                  className={`absolute z-20 h-4 w-4 rounded-full border border-brand-700 bg-brand-500 shadow md:h-3 md:w-3 ${handle.className}`}
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
              <div className="flex justify-center pt-1">
                <Button variant="secondary" className="h-8 px-3 text-xs" onClick={handleAddPage}>
                  {t("editor.addPage")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="flex min-h-[720px] flex-col overflow-hidden border-[#dce4f3] bg-[linear-gradient(180deg,#f8faff_0%,#eef3fb_100%)] p-0 shadow-[0_22px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#121212]">
        <div className="border-b border-[#e1e7f1] bg-white/94 px-4 py-3 dark:border-white/10 dark:bg-[#151515]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7d849a] dark:text-[#98a0b7]">
                {t("editor.sidebarEyebrow")}
              </p>
              <p className="mt-1 text-sm text-[#6f7890] dark:text-[#a9b0c6]">
                {selectedModuleEntry?.labels[i18n.language === "fr" ? "fr" : "en"] ?? t("editor.tabs.content")}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {teamModeEnabled && definedTeams.length > 0 ? (
                <select
                  className="h-10 max-w-[160px] rounded-2xl border border-slate-300 bg-white px-3 text-sm dark:border-white/10 dark:bg-[#101010]"
                  value={selectedPdfTeam}
                  onChange={(event) => setSelectedPdfTeam(event.target.value)}
                >
                  <option value="all">{t("editor.pdfAllModules")}</option>
                  {definedTeams.map((team) => (
                    <option key={team} value={team}>
                      PDF: {team}
                    </option>
                  ))}
                </select>
              ) : null}
              <Button className="h-10 px-4" onClick={() => void handleSave(true)} disabled={saving}>
                {saving ? t("app.loading") : t("app.save")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => void handlePdf()}
                disabled={pdfButtonState === "loading"}
                className={`h-10 px-4 ${pdfButtonState === "ready" ? "border-emerald-300 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300" : ""}`}
                aria-label={pdfButtonState === "ready" ? t("editor.downloadReady") : undefined}
              >
                {pdfButtonState === "loading" ? <Loader2 size={14} className="animate-spin" /> : null}
                {pdfButtonState === "ready" ? <Check size={14} /> : null}
                {pdfButtonState === "idle"
                  ? t("editor.pdf")
                  : pdfButtonState === "loading"
                    ? t("editor.loadingShort")
                    : t("editor.downloadReady")}
              </Button>
              <Button variant="secondary" className="h-10 px-4" onClick={() => setShareOpen(true)}>
                <Share2 size={14} />
                {t("editor.share")}
              </Button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <SidebarTabButton
              active={sidebarTab === "content"}
              icon={<FileText size={14} />}
              label={t("editor.tabs.content")}
              onClick={() => setSidebarTab("content")}
            />
            <SidebarTabButton
              active={sidebarTab === "modules"}
              icon={<LayoutGrid size={14} />}
              label={t("editor.tabs.modules")}
              onClick={() => setSidebarTab("modules")}
            />
            <SidebarTabButton
              active={sidebarTab === "settings"}
              icon={<Settings2 size={14} />}
              label={t("editor.tabs.settings")}
              onClick={() => setSidebarTab("settings")}
            />
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {sidebarTab === "content" ? (
            <div className="rounded-[24px] border border-[#dfe5f0] bg-white/96 p-4 shadow-sm dark:border-white/10 dark:bg-[#161616]">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7d849a] dark:text-[#98a0b7]">
                <FileText size={14} />
                <span>{t("editor.contentDetails")}</span>
              </div>
              <MetadataForm core={state.core} metadata={state.modules.metadata.data} onChange={updateMetadata} />
            </div>
          ) : null}

          {sidebarTab === "modules" ? (
            <>
              <SidebarDisclosure
                title={t("editor.previewTools")}
                description={t("editor.previewToolsHint")}
                icon={<SlidersHorizontal size={14} />}
                defaultOpen
              >
                <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[#e3e9f3] bg-[#fbfcff] px-3 py-3 dark:border-white/10 dark:bg-[#101010]">
                  <div>
                    <p className="text-sm font-medium text-[#273047] dark:text-white">{t("editor.previewHandles")}</p>
                    <p className="mt-1 text-xs text-[#6f7890] dark:text-[#a9b0c6]">{t("editor.previewHandlesHint")}</p>
                  </div>
                  <Toggle
                    checked={showPreviewAnchors}
                    onChange={setShowPreviewAnchors}
                    ariaLabel={t("editor.previewHandles")}
                  />
                </div>
              </SidebarDisclosure>

              <SidebarDisclosure
                title={t("editor.tabs.modules")}
                description={t("editor.modulesOverview")}
                icon={<LayoutGrid size={14} />}
                defaultOpen
              >
                <ModuleList
                  state={state}
                  selected={state.selectedModuleKey}
                  onSelect={(key) => {
                    setState((prev) => ({ ...prev, selectedModuleKey: key }));
                    setSidebarTab("settings");
                  }}
                  onToggle={setModuleEnabled}
                />
              </SidebarDisclosure>
            </>
          ) : null}

          {sidebarTab === "settings" ? (
            <>
              <SidebarDisclosure
                title={t("editor.layoutSettings")}
                description={selectedModuleEntry?.labels[i18n.language === "fr" ? "fr" : "en"]}
                icon={<LayoutGrid size={14} />}
                defaultOpen
              >
                <div className="rounded-xl border border-[#e6e8f2] p-3 dark:border-white/10">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t("editor.pageLabel")}</p>
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="page-selector-sidebar"
                      className="h-10 min-w-[130px] rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-white/10 dark:bg-[#101010]"
                      value={selectedModule.layout.desktop.page}
                      onChange={(event) => updateSelectedModulePage(Number(event.target.value))}
                    >
                      {Array.from({ length: pageCount }, (_, pageIndex) => (
                        <option key={pageIndex} value={pageIndex}>
                          {t("editor.page", { count: pageIndex + 1 })}
                        </option>
                      ))}
                    </select>
                    <Button variant="secondary" className="h-10 px-3 text-xs" onClick={handleAddPage}>
                      {t("editor.addPage")}
                    </Button>
                  </div>
                </div>
              </SidebarDisclosure>

              {teamModeEnabled && definedTeams.length > 0 ? (
                <SidebarDisclosure
                  title={t("editor.audienceTags")}
                  icon={<User size={14} />}
                  defaultOpen
                >
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
                </SidebarDisclosure>
              ) : null}

              <SidebarDisclosure
                title={t("editor.moduleEdit")}
                icon={<Settings2 size={14} />}
                defaultOpen
              >
                <ModulePanel
                  state={state}
                  selected={state.selectedModuleKey}
                  onChange={(key, patch) =>
                    setState((prev) => ({
                      ...prev,
                      modules: {
                        ...prev.modules,
                        [key]: {
                          ...prev.modules[key],
                          settings: patch.settings ?? prev.modules[key].settings,
                          data: (patch.data ?? prev.modules[key].data) as ModuleDataMap[typeof key]
                        }
                      }
                    }))
                  }
                />
              </SidebarDisclosure>
            </>
          ) : null}
        </div>
        <div className="border-t border-[#e1e7f1] bg-white/94 px-4 py-3 dark:border-white/10 dark:bg-[#151515]">
          <span className="block text-xs text-slate-500">{saveStatusLabel}</span>
        </div>
      </Card>
      <SharePanel
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        briefingId={briefing.id}
        hasPdf={selectedPdfTeam === "all" ? Boolean(pdfPath) : Boolean(teamPdfPaths[selectedPdfTeam])}
        teams={teamModeEnabled ? definedTeams : []}
        selectedTeam={teamModeEnabled && selectedPdfTeam !== "all" ? selectedPdfTeam : null}
      />
    </div>
  );
}
