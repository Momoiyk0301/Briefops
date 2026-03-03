import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { downloadPdf, patchBriefing, toApiMessage, upsertBriefingModules } from "@/lib/api";
import { moduleRegistry } from "@/lib/moduleRegistry";
import { Briefing, BriefingModuleRow, EditorState, ModuleDataMap, ModuleKey } from "@/lib/types";
import { A4Preview } from "@/components/briefing/A4Preview";
import { MetadataForm } from "@/components/briefing/MetadataForm";
import { ModuleList } from "@/components/briefing/ModuleList";
import { ModulePanel } from "@/components/briefing/ModulePanel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function buildInitialState(briefing: Briefing, rows: BriefingModuleRow[]): EditorState {
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
  const { t } = useTranslation();
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
        <A4Preview state={state} />
      </Card>

      <Card className="space-y-4">
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

        <ModuleList
          state={state}
          selected={state.selectedModuleKey}
          onSelect={(key) => setState((prev) => ({ ...prev, selectedModuleKey: key }))}
          onToggle={(key, enabled) => setState((prev) => ({
            ...prev,
            modules: {
              ...prev.modules,
              [key]: { ...prev.modules[key], enabled }
            }
          }))}
        />

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

        <div className="flex gap-2">
          <Button onClick={() => void handleSave(true)} disabled={saving}>{saving ? t("app.loading") : t("app.save")}</Button>
          <Button variant="secondary" onClick={() => void handlePdf()}>{t("app.downloadPdf")}</Button>
        </div>
      </Card>
    </div>
  );
}
