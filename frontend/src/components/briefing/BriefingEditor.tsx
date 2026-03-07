import { PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { FileText } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { generateBriefingPdf, getStorageSignedUrl, patchBriefing, toApiMessage, upsertBriefingModules } from "@/lib/api";
import { GridRect, ResizeHandle, tryMoveModuleRect, tryResizeModuleRect } from "@/lib/moduleLayout";
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

function rectTouchesOrOverlaps(a: GridRect, b: GridRect) {
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

export function BriefingEditor({ briefing, modules, registryModules = [] }: Props) {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState<EditorState>(() => buildInitialState(briefing, modules, registryModules));
  const [saving, setSaving] = useState(false);
  const [hoveredModuleKey, setHoveredModuleKey] = useState<ModuleKey | null>(null);
  const [mobilePanel, setMobilePanel] = useState<"meta" | "modules" | "edit">("modules");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!briefing.pdf_path) return;
      try {
        const signedUrl = await getStorageSignedUrl("exports", briefing.pdf_path, 3600);
        if (!cancelled) setPdfUrl(signedUrl);
      } catch {
        if (!cancelled) setPdfUrl(null);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [briefing.pdf_path]);

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
    const toastId = toast.loading("PDF en cours de generation...");
    try {
      setIsGeneratingPdf(true);
      const result = await generateBriefingPdf(briefing.id);
      setPdfUrl(result.pdf_url);
      toast.success("PDF pret", { id: toastId });
    } catch (error) {
      const msg = toApiMessage(error);
      toast.error(msg.includes("limit") ? t("editor.pdfDenied") : msg, { id: toastId });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const startPointerInteraction = (
    event: ReactPointerEvent,
    key: ModuleKey,
    mode: "move" | "resize",
    handle?: ResizeHandle
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const canvas = canvasRef.current;
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
      .filter((otherKey) => otherKey !== key && state.modules[otherKey].enabled)
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
              desktop: nextRect
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

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
      <Card className="flex justify-center p-4">
        <div className="a4-frame w-full max-w-[820px] rounded-xl border border-slate-300 bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900">
          <div
            ref={canvasRef}
            className="relative mx-auto aspect-[210/297] w-full touch-none overflow-hidden rounded-lg border border-[#e8eaf3] bg-white dark:border-white/10 dark:bg-[#0f0f10]"
          >
            {visibleModules.map((entry) => {
              const module = state.modules[entry.key];
              const style = toCanvasStyle(module.layout);
              const isSelected = state.selectedModuleKey === entry.key;
              const isActive = hoveredModuleKey === entry.key || isSelected;
              const PreviewComponent = moduleRegistry[entry.key].PreviewComponent;

              return (
                <section
                  key={entry.key}
                  style={style}
                  className={`absolute touch-none overflow-hidden rounded-md border bg-white/95 p-2 shadow-sm transition dark:bg-[#151515] ${
                    isActive ? "border-brand-500 ring-1 ring-brand-500/20" : "border-[#dfe3ef] dark:border-white/10"
                  }`}
                  onMouseEnter={() => setHoveredModuleKey(entry.key)}
                  onMouseLeave={() => setHoveredModuleKey((prev) => (prev === entry.key ? null : prev))}
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

                  {isActive ? (
                    <>
                      <button
                        type="button"
                        aria-label={`move-${entry.key}`}
                        className="absolute left-1/2 top-0 z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-500 bg-cyan-400 shadow md:h-3 md:w-3"
                        onPointerDown={(event) => startPointerInteraction(event, entry.key, "move")}
                      />

                      {RESIZE_HANDLES.map((handle) => (
                        <button
                          key={handle.key}
                          type="button"
                          aria-label={`resize-${entry.key}-${handle.key}`}
                          className={`absolute z-20 h-4 w-4 rounded-full border border-brand-700 bg-brand-500 shadow md:h-3 md:w-3 ${handle.className}`}
                          style={{ cursor: handle.cursor }}
                          onPointerDown={(event) => startPointerInteraction(event, entry.key, "resize", handle.key)}
                        />
                      ))}
                    </>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="grid grid-cols-3 gap-2 xl:hidden">
          <Button variant={mobilePanel === "meta" ? "primary" : "secondary"} onClick={() => setMobilePanel("meta")}>Meta</Button>
          <Button variant={mobilePanel === "modules" ? "primary" : "secondary"} onClick={() => setMobilePanel("modules")}>Modules</Button>
          <Button variant={mobilePanel === "edit" ? "primary" : "secondary"} onClick={() => setMobilePanel("edit")}>Edition</Button>
        </div>

        <div className={`rounded-2xl border border-[#e8eaf3] p-3 dark:border-white/10 ${mobilePanel !== "meta" ? "hidden xl:block" : ""}`}>
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

        <div className={`rounded-2xl border border-[#e8eaf3] p-3 dark:border-white/10 ${mobilePanel !== "modules" ? "hidden xl:block" : ""}`}>
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

        <div className={`rounded-2xl border border-[#e8eaf3] p-3 dark:border-white/10 ${mobilePanel !== "edit" ? "hidden xl:block" : ""}`}>
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
          <Button variant="secondary" onClick={() => void handlePdf()} disabled={isGeneratingPdf}>
            {isGeneratingPdf ? t("app.loading") : t("app.downloadPdf")}
          </Button>
          {pdfUrl ? (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="open-generated-pdf"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e6e8f2] text-[#d22] transition hover:bg-red-50 dark:border-white/10"
            >
              <FileText size={18} />
            </a>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
