import { deliveryFieldDefinitions, deliverySettingsDefinitions, moduleRegistry } from "@/lib/moduleRegistry";
import {
  AccessData,
  ContactData,
  DeliveryData,
  DeliverySettings,
  EditorState,
  EquipmentData,
  ModuleDataMap,
  ModuleKey,
  NotesData,
  StaffData,
  VehicleData
} from "@/lib/types";

type Props = {
  state: EditorState;
  selected: Exclude<ModuleKey, "metadata">;
  onChange: (
    key: Exclude<ModuleKey, "metadata">,
    patch: { data?: ModuleDataMap[Exclude<ModuleKey, "metadata">]; settings?: Record<string, unknown> }
  ) => void;
};

export function ModulePanel({ state, selected, onChange }: Props) {
  switch (selected) {
    case "access": {
      const Form = moduleRegistry.access.FormComponent;
      return <Form value={state.modules.access.data} onChange={(value) => onChange("access", { data: value as AccessData })} />;
    }
    case "delivery": {
      const Form = moduleRegistry.delivery.FormComponent;
      return (
        <Form
          value={state.modules.delivery.data}
          settings={state.modules.delivery.settings as DeliverySettings}
          settingsSchema={deliverySettingsDefinitions}
          fieldSchema={deliveryFieldDefinitions}
          onChange={(value) => onChange("delivery", { data: value as DeliveryData })}
          onSettingsChange={(settings) => onChange("delivery", { settings })}
        />
      );
    }
    case "vehicle": {
      const Form = moduleRegistry.vehicle.FormComponent;
      return <Form value={state.modules.vehicle.data} onChange={(value) => onChange("vehicle", { data: value as VehicleData })} />;
    }
    case "equipment": {
      const Form = moduleRegistry.equipment.FormComponent;
      return <Form value={state.modules.equipment.data} onChange={(value) => onChange("equipment", { data: value as EquipmentData })} />;
    }
    case "staff": {
      const Form = moduleRegistry.staff.FormComponent;
      return <Form value={state.modules.staff.data} onChange={(value) => onChange("staff", { data: value as StaffData })} />;
    }
    case "notes": {
      const Form = moduleRegistry.notes.FormComponent;
      return <Form value={state.modules.notes.data} onChange={(value) => onChange("notes", { data: value as NotesData })} />;
    }
    case "contact": {
      const Form = moduleRegistry.contact.FormComponent;
      return <Form value={state.modules.contact.data} onChange={(value) => onChange("contact", { data: value as ContactData })} />;
    }
    default:
      return null;
  }
}
