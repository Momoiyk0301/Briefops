import { useEffect, useMemo, useRef, useState } from "react";
import { Check, GripVertical, Loader2, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { generateBriefingPdf, getStorageSignedUrl, patchBriefing, toApiMessage, upsertBriefingModules } from "@/lib/api";
import { getErrorMessage } from "@/lib/errorMessages";
import { parseModuleRow, toCanonicalModuleJson } from "@/lib/moduleCanonical";
import { moduleEntries } from "@/lib/moduleRegistry";
import { Briefing, BriefingModuleRow, EditorState, ModuleDataMap, ModuleKey, RegistryModule } from "@/lib/types";
import { MetadataForm } from "@/components/briefing/MetadataForm";
import { ModulePanel } from "@/components/briefing/ModulePanel";
import { SharePanel } from "@/components/briefing/SharePanel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";

const NON_METADATA_KEYS = moduleEntries
  .filter((entry) => entry.key !== "metadata")
  .map((entry) => entry.key) as Exclude<ModuleKey, "metadata">[];

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

  const defaultSelected = (moduleEntries.find((entry) => entry.key !== "metadata" && rawModules[entry.key].enabled)?.key ?? "access") as Exclude<
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
    modules: rawModules
  };
}

function buildInitialOrder(rows: BriefingModuleRow[]): Exclude<ModuleKey, "metadata">[] {
  const rowMap = new Map(rows.map((row) => [row.module_key, row.order_index ?? 0]));
  return [...NON_METADATA_KEYS].sort((a, b) => {
    const oa = rowMap.get(a) ?? NON_METADATA_KEYS.indexOf(a);
    const ob = rowMap.get(b) ?? NON_METADATA_KEYS.indexOf(b);
    return oa - ob;
  });
}

type Props = {
  briefing: Briefing;
  modules: BriefingModuleRow[];
  registryModules?: RegistryModule[];
};

export function BriefingEditor({ briefing, modules, registryModules = [] }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "fr" ? "fr" : "en";

  const [state, setState] = useState<EditorState>(() => buildInitialState(briefing, modules, registryModules));
  const [moduleOrder, setModuleOrder] = useState<Exclude<ModuleKey, "metadata">[]>(() => buildInitialOrder(modules));
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validateConfirm, setValidateConfirm] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [pdfButtonState, setPdfButtonState] = useState<"idle" | "loading" | "ready">("idle");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfPath, setPdfPath] = useState<string | null>(briefing.pdf_path ?? null);
  const [pdfFilename, setPdfFilename] = useState<string | null>(briefing.pdf_path?.split("/").pop() ?? null);
  const [saveIndicator, setSaveIndicator] = useState<"hidden" | "saving" | "saved" | "timestamp">("hidden");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [dragKey, setDragKey] = useState<Exclude<ModuleKey, "metadata"> | null>(null);
  const lastSaved = useRef("");
  const saveIndicatorTimeoutRef = useRef<number | null>(null);
  const validateConfirmTimeoutRef = useRef<number | null>(null);

  const teamModeEnabled = state.modules.metadata.data.team_mode;
  const definedTeams = state.modules.metadata.data.teams;

  const setSavedIndicator = (savedAt: Date) => {
    setLastSavedAt(savedAt.toISOString());
    setSaveIndicator("saved");
    if (saveIndicatorTimeoutRef.current) window.clearTimeout(saveIndicatorTimeoutRef.current);
    saveIndicatorTimeoutRef.current = window.setTimeout(() => {
      setSaveIndicator("timestamp");
      saveIndicatorTimeoutRef.current = null;
    }, 1200);
  };

  useEffect(() => {
    if (briefing.pdf_path) {
      let cancelled = false;
      getStorageSignedUrl("exports", briefing.pdf_path, 3600)
        .then((url) => {
          if (!cancelled) {
            setPdfUrl(url);
            setPdfPath(briefing.pdf_path!);
            setPdfFilename(briefing.pdf_path!.split("/").pop() ?? "briefing.pdf");
            setPdfButtonState("ready");
          }
        })
        .catch(() => {
          if (!cancelled) setPdfUrl(null);
        });
      return () => { cancelled = true; };
    }
  }, [briefing.pdf_path]);

  useEffect(() => {
    return () => {
      if (saveIndicatorTimeoutRef.current) window.clearTimeout(saveIndicatorTimeoutRef.current);
      if (validateConfirmTimeoutRef.current) window.clearTimeout(validateConfirmTimeoutRef.current);
    };
  }, []);

  const payload = useMemo(
    () =>
      (Object.keys(state.modules) as ModuleKey[]).map((key) => ({
        module_id: state.modules[key].module_id ?? null,
        module_key: key,
        enabled: state.modules[key].enabled,
        tags: state.modules[key].audience.teams,
        order_index: key === "metadata" ? -1 : moduleOrder.indexOf(key as Exclude<ModuleKey, "metadata">),
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
    [state.modules, moduleOrder]
  );

  useEffect(() => {
    const snapshot = JSON.stringify({ state, moduleOrder });
    if (!lastSaved.current) { lastSaved.current = snapshot; return; }
    if (snapshot === lastSaved.current) return;
    const id = window.setTimeout(() => {
      setSaveIndicator("saving");
      void handleSave(false);
    }, 800);
    return () => window.clearTimeout(id);
  }, [state, moduleOrder]);

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
            (nextModules as Record<string, EditorState["modules"][ModuleKey]>)[key] = {
              ...module,
              audience: { ...module.audience, mode: nextMode, teams: filteredTeams }
            };
          }
        });
      return changed ? { ...prev, modules: nextModules } : prev;
    });
  }, [definedTeams, teamModeEnabled]);

  const handleSave = async (_manual = true) => {
    try {
      setSaving(true);
      await patchBriefing(briefing.id, {
        title: state.core.title,
        event_date: state.core.event_date,
        location_text: state.core.location_text
      });
      await upsertBriefingModules(briefing.id, payload);
      lastSaved.current = JSON.stringify({ state, moduleOrder });
      setSavedIndicator(new Date());
    } catch {
      setSaveIndicator(lastSavedAt ? "timestamp" : "hidden");
      toast.error(getErrorMessage("BRIEFING_UPDATE_FAILED"));
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    setValidateConfirm(false);
    if (validateConfirmTimeoutRef.current) window.clearTimeout(validateConfirmTimeoutRef.current);
    try {
      setValidating(true);
      await handleSave(true);
      await patchBriefing(briefing.id, { status: "validated" });
      toast.success(t("editor.validateSuccess"));
    } catch {
      toast.error(getErrorMessage("BRIEFING_UPDATE_FAILED"));
    } finally {
      setValidating(false);
    }
  };

  const requestValidate = () => {
    setValidateConfirm(true);
    if (validateConfirmTimeoutRef.current) window.clearTimeout(validateConfirmTimeoutRef.current);
    validateConfirmTimeoutRef.current = window.setTimeout(() => {
      setValidateConfirm(false);
      validateConfirmTimeoutRef.current = null;
    }, 4000);
  };

  const handlePdf = async () => {
    if (pdfButtonState === "ready" && pdfUrl && pdfFilename) {
      try {
        const url = pdfPath ? await getStorageSignedUrl("exports", pdfPath, 3600) : pdfUrl;
        const a = document.createElement("a");
        a.href = url; a.download = pdfFilename; a.rel = "noopener noreferrer";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        return;
      } catch (error) {
        toast.error(toApiMessage(error));
      }
    }
    const toastId = toast.loading(t("editor.pdfGenerating"));
    try {
      setPdfButtonState("loading");
      const result = await generateBriefingPdf(briefing.id, null);
      setPdfUrl(result.pdf_url); setPdfPath(result.pdf_path); setPdfFilename(result.filename);
      setPdfButtonState("ready");
      toast.success(t("editor.pdfReady"), { id: toastId });
    } catch (error) {
      toast.error(toApiMessage(error), { id: toastId });
      setPdfButtonState("idle");
    }
  };

  const updateMetadata = (core: EditorState["core"], metadata: EditorState["modules"]["metadata"]["data"]) => {
    setState((prev) => ({ ...prev, core, modules: { ...prev.modules, metadata: { ...prev.modules.metadata, data: metadata } } }));
  };

  const setModuleEnabled = (key: ModuleKey, enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      modules: { ...prev.modules, [key]: { ...prev.modules[key], enabled, metadata: { ...prev.modules[key].metadata, enabled } } }
    }));
  };

  const updateModuleData = (key: Exclude<ModuleKey, "metadata">, patch: { data?: ModuleDataMap[Exclude<ModuleKey, "metadata">]; settings?: Record<string, unknown> }) => {
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
    }));
  };

  const toggleTagForModule = (key: Exclude<ModuleKey, "metadata">, team: string) => {
    setState((prev) => {
      const module = prev.modules[key];
      const exists = module.audience.teams.some((v) => v.toLowerCase() === team.toLowerCase());
      const teams = exists
        ? module.audience.teams.filter((v) => v.toLowerCase() !== team.toLowerCase())
        : [...module.audience.teams, team];
      return {
        ...prev,
        modules: {
          ...prev.modules,
          [key]: { ...module, audience: { ...module.audience, mode: teams.length > 0 ? "teams" : "all", teams } }
        }
      };
    });
  };

  const clearTagsForModule = (key: Exclude<ModuleKey, "metadata">) => {
    setState((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [key]: { ...prev.modules[key], audience: { ...prev.modules[key].audience, mode: "all", teams: [] } }
      }
    }));
  };

  const handleDragStart = (key: Exclude<ModuleKey, "metadata">) => setDragKey(key);

  const handleDragOver = (event: React.DragEvent, overKey: Exclude<ModuleKey, "metadata">) => {
    event.preventDefault();
    if (!dragKey || dragKey === overKey) return;
    setModuleOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(dragKey);
      const toIdx = next.indexOf(overKey);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, dragKey);
      return next;
    });
  };

  const handleDragEnd = () => setDragKey(null);

  const saveStatusLabel =
    saveIndicator === "saving" ? t("editor.saving")
    : saveIndicator === "saved" ? t("editor.savedShort")
    : saveIndicator === "timestamp" && lastSavedAt
      ? t("editor.savedAt", {
          time: new Intl.DateTimeFormat(lang === "fr" ? "fr-BE" : "en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date(lastSavedAt))
        })
      : "";

  const orderedEnabledModules = moduleOrder.filter((key) => state.modules[key].enabled);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">

      {/* ── TOP BAR (mockup exact) ── */}
      <header className="sticky top-0 z-40 flex h-[52px] shrink-0 items-center gap-4 border-b border-[var(--border)] bg-[var(--bg-2)] px-5">

        {/* Breadcrumb */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px] text-[var(--ink-3)]">
          <span className="hidden truncate max-w-[120px] md:block">{t("nav.briefings")}</span>
          <span className="hidden text-[var(--border-2)] md:block">/</span>
          <strong className="truncate font-semibold text-[var(--ink)]">
            {state.core.title || t("editor.untitled")}
          </strong>
        </div>

        {/* Save indicator */}
        {saveStatusLabel ? (
          <div className="hidden shrink-0 items-center gap-1.5 font-mono text-[11px] text-[var(--ink-4)] md:flex">
            <span className="h-[5px] w-[5px] shrink-0 rounded-full" style={{ background: saving ? "var(--border-2)" : "#10b981" }} />
            {saveStatusLabel}
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void handlePdf()}
            disabled={pdfButtonState === "loading"}
            className={`editor-btn editor-btn-ghost ${pdfButtonState === "ready" ? "text-emerald-700 border-emerald-300" : ""}`}
          >
            {pdfButtonState === "loading" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : pdfButtonState === "ready" ? (
              <Check size={13} />
            ) : (
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ width: 13, height: 13 }}>
                <path d="M8 2v8M4 7l4 4 4-4M2 13h12" />
              </svg>
            )}
            {pdfButtonState === "idle" ? t("editor.pdf") : pdfButtonState === "loading" ? t("editor.loadingShort") : t("editor.downloadReady")}
          </button>

          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="editor-btn editor-btn-secondary"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ width: 13, height: 13 }}>
              <circle cx="4" cy="8" r="2" /><circle cx="12" cy="4" r="2" /><circle cx="12" cy="12" r="2" />
              <path d="M5.8 7.1L10 4.9M5.8 8.9L10 11.1" />
            </svg>
            {t("editor.share")}
          </button>

          {validateConfirm ? (
            <>
              <button
                type="button"
                className="editor-btn editor-btn-primary"
                onClick={() => void handleValidate()}
                disabled={validating}
              >
                {validating ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {t("editor.validateConfirm")}
              </button>
              <button type="button" className="editor-btn editor-btn-secondary" onClick={() => setValidateConfirm(false)}>
                {t("editor.validateCancel")}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="editor-btn editor-btn-primary"
              onClick={requestValidate}
              disabled={saving || validating}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ width: 13, height: 13 }}>
                <path d="M2 8l4 4 8-8" />
              </svg>
              {saving ? t("app.loading") : t("editor.validate")}
            </button>
          )}
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Main form */}
        <main className="flex-1 min-w-0 overflow-y-auto" style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Détails card */}
          <div className="editor-form-card">
            <div className="editor-form-card-header">
              <span className="editor-form-card-title">{t("editor.contentDetails")}</span>
            </div>
            <div className="editor-form-card-body">
              <MetadataForm core={state.core} metadata={state.modules.metadata.data} onChange={updateMetadata} />
            </div>
          </div>

          {/* Module cards in order */}
          {orderedEnabledModules.map((key) => {
            const entry = moduleEntries.find((e) => e.key === key)!;
            const module = state.modules[key];
            const moduleTeams = module.audience.teams;
            return (
              <div
                key={key}
                draggable
                onDragStart={() => handleDragStart(key)}
                onDragOver={(event) => handleDragOver(event, key)}
                onDragEnd={handleDragEnd}
                className="editor-form-card"
                style={dragKey === key ? { opacity: 0.6, outline: "2px solid oklch(49% 0.22 258)" } : undefined}
              >
                <div className="editor-form-card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Drag handle */}
                    <div className="editor-drag-dots" style={{ cursor: "grab" }}>
                      <div className="editor-drag-row"><span className="editor-drag-dot" /><span className="editor-drag-dot" /></div>
                      <div className="editor-drag-row"><span className="editor-drag-dot" /><span className="editor-drag-dot" /></div>
                    </div>
                    <span className="editor-form-card-title">{entry.labels[lang]}</span>
                    <span className="editor-module-active-badge">{t("editor.active") ?? "Actif"}</span>
                  </div>
                </div>
                <div className="editor-form-card-body">
                  <ModulePanel
                    state={state}
                    selected={key}
                    onChange={(k, patch) => updateModuleData(k, patch)}
                  />
                </div>
                {teamModeEnabled && definedTeams.length > 0 ? (
                  <div className="editor-audience-bar">
                    <p className="editor-audience-label">{t("editor.audienceTags")}</p>
                    <div className="editor-team-tags">
                      <button
                        type="button"
                        className={`editor-team-tag ${moduleTeams.length === 0 ? "active" : ""}`}
                        onClick={() => clearTagsForModule(key)}
                      >
                        {t("editor.allTeams")}
                      </button>
                      {definedTeams.map((team) => {
                        const active = moduleTeams.some((v) => v.toLowerCase() === team.toLowerCase());
                        return (
                          <button
                            key={team}
                            type="button"
                            className={`editor-team-tag ${active ? "active" : ""}`}
                            onClick={() => toggleTagForModule(key, team)}
                          >
                            {team}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </main>

        {/* ── SIDEBAR MODULES (right) ── */}
        <aside className="editor-sidebar hidden lg:flex">
          <div className="editor-sidebar-header">
            {t("editor.tabs.modules")}
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14, color: "var(--ink-4)" }}>
              <circle cx="8" cy="8" r="6" /><path d="M8 7v4M8 5.5v.5" />
            </svg>
          </div>

          <div className="editor-sidebar-modules">
            {moduleOrder.map((key) => {
              const entry = moduleEntries.find((e) => e.key === key)!;
              const enabled = state.modules[key].enabled;
              return (
                <div
                  key={key}
                  draggable
                  onDragStart={() => handleDragStart(key)}
                  onDragOver={(event) => handleDragOver(event, key)}
                  onDragEnd={handleDragEnd}
                  className="editor-sidebar-module"
                  style={dragKey === key ? { opacity: 0.5 } : undefined}
                >
                  <div className="editor-sidebar-module-left">
                    <div className="editor-drag-dots" style={{ cursor: "grab" }}>
                      <div className="editor-drag-row"><span className="editor-drag-dot" /><span className="editor-drag-dot" /></div>
                      <div className="editor-drag-row"><span className="editor-drag-dot" /><span className="editor-drag-dot" /></div>
                    </div>
                    <span className={`editor-sidebar-module-name ${enabled ? "active" : ""}`}>
                      {entry.labels[lang]}
                    </span>
                  </div>
                  {!entry.isMandatory ? (
                    <button
                      type="button"
                      className={`editor-toggle-sm ${enabled ? "on" : ""}`}
                      aria-label={entry.labels[lang]}
                      onClick={() => setModuleEnabled(key, !enabled)}
                    />
                  ) : (
                    <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--ink-4)" }}>—</span>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      <SharePanel
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        briefingId={briefing.id}
        teams={teamModeEnabled ? definedTeams : []}
        onExportPdf={() => void handlePdf()}
      />
    </div>
  );
}
