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
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-[#e2e7f2] bg-white/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-[#161616]/95">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-[#172033] dark:text-white">
              {state.core.title || t("editor.untitled")}
            </h2>
            <span className="text-xs text-slate-400">{saveStatusLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            {validateConfirm ? (
              <>
                <Button
                  className="h-9 px-4 border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-300"
                  onClick={() => void handleValidate()}
                  disabled={validating}
                >
                  {validating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {t("editor.validateConfirm")}
                </Button>
                <Button variant="secondary" className="h-9 px-3" onClick={() => setValidateConfirm(false)}>
                  {t("editor.validateCancel")}
                </Button>
              </>
            ) : (
              <Button className="h-9 px-4" onClick={requestValidate} disabled={saving || validating}>
                {saving ? t("app.loading") : t("editor.validate")}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => void handlePdf()}
              disabled={pdfButtonState === "loading"}
              className={`h-9 px-4 ${pdfButtonState === "ready" ? "border-emerald-300 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300" : ""}`}
            >
              {pdfButtonState === "loading" ? <Loader2 size={14} className="animate-spin" /> : null}
              {pdfButtonState === "ready" ? <Check size={14} /> : null}
              {pdfButtonState === "idle" ? t("editor.pdf") : pdfButtonState === "loading" ? t("editor.loadingShort") : t("editor.downloadReady")}
            </Button>
            <Button variant="secondary" className="h-9 px-4" onClick={() => setShareOpen(true)}>
              <Share2 size={14} />
              {t("editor.share")}
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main column: 70% */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Metadata form */}
          <Card className="p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7d849a]">{t("editor.contentDetails")}</p>
            <MetadataForm core={state.core} metadata={state.modules.metadata.data} onChange={updateMetadata} />
          </Card>

          {/* Enabled modules in order */}
          {orderedEnabledModules.map((key) => {
            const entry = moduleEntries.find((e) => e.key === key)!;
            const module = state.modules[key];
            const moduleTeams = module.audience.teams;
            return (
              <Card key={key} className="overflow-hidden p-0">
                <div className="border-b border-[#e8edf5] bg-slate-50/60 px-4 py-2.5 dark:border-white/10 dark:bg-[#161616]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7d849a]">
                    {entry.labels[lang]}
                  </p>
                </div>
                <div className="p-4">
                  <ModulePanel
                    state={state}
                    selected={key}
                    onChange={(k, patch) => updateModuleData(k, patch)}
                  />
                </div>
                {teamModeEnabled && definedTeams.length > 0 ? (
                  <div className="border-t border-[#e8edf5] px-4 py-3 dark:border-white/10">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8890a6]">
                      {t("editor.audienceTags")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        className={`rounded-full border px-2.5 py-1 text-xs transition ${
                          moduleTeams.length === 0
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-900/20 dark:text-emerald-300"
                            : "border-[#d9dcea] bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-[#101010] dark:text-slate-300"
                        }`}
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
                            className={`rounded-full border px-2.5 py-1 text-xs transition ${
                              active
                                ? "border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-900/20 dark:text-brand-300"
                                : "border-[#d9dcea] bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-[#101010] dark:text-slate-300"
                            }`}
                            onClick={() => toggleTagForModule(key, team)}
                          >
                            {team}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>

        {/* Sidebar: 30% */}
        <aside className="hidden w-72 flex-shrink-0 overflow-y-auto border-l border-[#e2e7f2] bg-[#f8faff] p-4 space-y-4 lg:block dark:border-white/10 dark:bg-[#121212]">
          {/* Module list with DnD */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7d849a]">{t("editor.tabs.modules")}</p>
            <div className="space-y-1">
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
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
                      dragKey === key
                        ? "border-brand-400 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-900/20"
                        : "border-[#e3e8f2] bg-white dark:border-white/10 dark:bg-[#1a1a1a]"
                    }`}
                  >
                    <GripVertical size={14} className="shrink-0 cursor-grab text-slate-400 active:cursor-grabbing" />
                    <span className="min-w-0 flex-1 truncate text-sm text-[#273047] dark:text-white">
                      {entry.labels[lang]}
                    </span>
                    {!entry.isMandatory ? (
                      <Toggle
                        checked={enabled}
                        onChange={(value) => setModuleEnabled(key, value)}
                        ariaLabel={entry.labels[lang]}
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400">{t("editor.mandatory") ?? "—"}</span>
                    )}
                  </div>
                );
              })}
            </div>
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
