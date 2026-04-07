import { ModuleFieldsRenderer } from "@/components/briefing/runtime/ModuleFieldsRenderer";
import { ModuleSettingsRenderer } from "@/components/briefing/runtime/ModuleSettingsRenderer";
import { DeliveryData, DeliverySettings, ModuleFieldDefinition, ModuleSettingDefinition } from "@/lib/types";

type Props = {
  value: DeliveryData;
  settings: DeliverySettings;
  settingsSchema: ModuleSettingDefinition[];
  fieldSchema: ModuleFieldDefinition[];
  onChange: (value: DeliveryData) => void;
  onSettingsChange: (settings: Record<string, unknown>) => void;
};

export function DeliveryForm({ value, settings, settingsSchema, fieldSchema, onChange, onSettingsChange }: Props) {
  return (
    <div className="space-y-3">
      <ModuleSettingsRenderer settings={settings} settingsSchema={settingsSchema} onChange={onSettingsChange} />
      <ModuleFieldsRenderer
        title="Add delivery"
        fields={fieldSchema}
        items={value.deliveries as Record<string, unknown>[]}
        settings={settings}
        onChange={(nextItems) => onChange({ deliveries: nextItems as DeliveryData["deliveries"] })}
      />
    </div>
  );
}
