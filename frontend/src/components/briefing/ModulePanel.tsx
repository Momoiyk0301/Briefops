import { moduleRegistry } from "@/lib/moduleRegistry";
import {
  AccessData,
  ContactData,
  DeliveryData,
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
  onChange: (key: Exclude<ModuleKey, "metadata">, data: ModuleDataMap[Exclude<ModuleKey, "metadata">]) => void;
};

export function ModulePanel({ state, selected, onChange }: Props) {
  switch (selected) {
    case "access": {
      const Form = moduleRegistry.access.FormComponent;
      return <Form value={state.modules.access.data} onChange={(value) => onChange("access", value as AccessData)} />;
    }
    case "delivery": {
      const Form = moduleRegistry.delivery.FormComponent;
      return <Form value={state.modules.delivery.data} onChange={(value) => onChange("delivery", value as DeliveryData)} />;
    }
    case "vehicle": {
      const Form = moduleRegistry.vehicle.FormComponent;
      return <Form value={state.modules.vehicle.data} onChange={(value) => onChange("vehicle", value as VehicleData)} />;
    }
    case "equipment": {
      const Form = moduleRegistry.equipment.FormComponent;
      return <Form value={state.modules.equipment.data} onChange={(value) => onChange("equipment", value as EquipmentData)} />;
    }
    case "staff": {
      const Form = moduleRegistry.staff.FormComponent;
      return <Form value={state.modules.staff.data} onChange={(value) => onChange("staff", value as StaffData)} />;
    }
    case "notes": {
      const Form = moduleRegistry.notes.FormComponent;
      return <Form value={state.modules.notes.data} onChange={(value) => onChange("notes", value as NotesData)} />;
    }
    case "contact": {
      const Form = moduleRegistry.contact.FormComponent;
      return <Form value={state.modules.contact.data} onChange={(value) => onChange("contact", value as ContactData)} />;
    }
    default:
      return null;
  }
}
