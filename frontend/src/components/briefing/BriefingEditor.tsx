import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { downloadPdf, patchBriefing, toApiMessage, upsertBriefingModules } from "@/lib/api";
import { moduleEntries, moduleRegistry } from "@/lib/moduleRegistry";
import { Briefing, BriefingModuleRow, EditorState, ModuleDataMap, ModuleKey } from "@/lib/types";
import { MetadataForm } from "@/components/briefing/MetadataForm";
import { ModuleList } from "@/components/briefing/ModuleList";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function buildInitialState(briefing: Briefing, rows: BriefingModuleRow[]): EditorState {
  const map = new Map(rows.map((row) => [row.module_key, row]));

  return {
    core: {
      title: briefing.title,
      event_date: briefing.event_date,
      location_text: briefing.location_text ?? ""
    },
    selectedModuleKey: "access",
    modules: {
      metadata: {
        key: "metadata",
        enabled: true,
        data: moduleRegistry.metadata.schema.parse(map.get("metadata")?.data_json ?? moduleRegistry.metadata.defaultData)
      },
      access: {
        key: "access",
        enabled: map.get("access")?.enabled ?? moduleRegistry.access.defaultEnabled,
        data: moduleRegistry.access.schema.parse(map.get("access")?.data_json ?? moduleRegistry.access.defaultData)
      },
      delivery: {
        key: "delivery",
        enabled: map.get("delivery")?.enabled ?? moduleRegistry.delivery.defaultEnabled,
        data: moduleRegistry.delivery.schema.parse(map.get("delivery")?.data_json ?? moduleRegistry.delivery.defaultData)
      },
      vehicle: {
        key: "vehicle",
        enabled: map.get("vehicle")?.enabled ?? moduleRegistry.vehicle.defaultEnabled,
        data: moduleRegistry.vehicle.schema.parse(map.get("vehicle")?.data_json ?? moduleRegistry.vehicle.defaultData)
      },
      equipment: {
        key: "equipment",
        enabled: map.get("equipment")?.enabled ?? moduleRegistry.equipment.defaultEnabled,
        data: moduleRegistry.equipment.schema.parse(map.get("equipment")?.data_json ?? moduleRegistry.equipment.defaultData)
      },
      staff: {
        key: "staff",
        enabled: map.get("staff")?.enabled ?? moduleRegistry.staff.defaultEnabled,
        data: moduleRegistry.staff.schema.parse(map.get("staff")?.data_json ?? moduleRegistry.staff.defaultData)
      },
      notes: {
        key: "notes",
        enabled: map.get("notes")?.enabled ?? moduleRegistry.notes.defaultEnabled,
        data: moduleRegistry.notes.schema.parse(map.get("notes")?.data_json ?? moduleRegistry.notes.defaultData)
      },
      contact: {
        key: "contact",
        enabled: map.get("contact")?.enabled ?? moduleRegistry.contact.defaultEnabled,
        data: moduleRegistry.contact.schema.parse(map.get("contact")?.data_json ?? moduleRegistry.contact.defaultData)
      }
    }
  };
}

type Props = {
  briefing: Briefing;
  modules: BriefingModuleRow[];
};

export function BriefingEditor({ briefing, modules }: Props) {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState<EditorState>(() => buildInitialState(briefing, modules));
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
        module_key: key,
        enabled: state.modules[key].enabled,
        data_json: state.modules[key].data
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

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
      <Card className="flex justify-center p-4">
        <div className="a4-frame overflow-auto rounded-xl border border-slate-300 bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900">
          <section className="mb-5 rounded-lg border border-[#e8eaf3] p-4 dark:border-white/10">
            <h2 className="text-xl font-bold">{state.core.title || "Sans titre"}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {(state.core.event_date || "Date non définie")} · {(state.core.location_text || "Lieu non défini")}
            </p>
            {(state.modules.metadata.data.main_contact_name || state.modules.metadata.data.main_contact_phone) ? (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Contact: {state.modules.metadata.data.main_contact_name || "—"} · {state.modules.metadata.data.main_contact_phone || "—"}
              </p>
            ) : null}
          </section>

          <div className="space-y-4">
            {moduleEntries
              .filter((entry) => entry.key !== "metadata" && state.modules[entry.key].enabled)
              .map((entry) => {
                const Form = moduleRegistry[entry.key].FormComponent as (props: {
                  value: unknown;
                  onChange: (value: unknown) => void;
                }) => any;
                return (
                  <section key={entry.key} className="rounded-lg border border-[#e8eaf3] p-4 dark:border-white/10">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      {entry.labels[i18n.language === "fr" ? "fr" : "en"]}
                    </h3>
                    <Form
                      value={state.modules[entry.key].data}
                      onChange={(value) =>
                        setState((prev) => ({
                          ...prev,
                          modules: {
                            ...prev.modules,
                            [entry.key]: {
                              ...prev.modules[entry.key],
                              data: value as ModuleDataMap[typeof entry.key]
                            }
                          }
                        }))
                      }
                    />
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
            onToggle={(key, enabled) => setState((prev) => ({
              ...prev,
              modules: {
                ...prev.modules,
                [key]: { ...prev.modules[key], enabled }
              }
            }))}
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
