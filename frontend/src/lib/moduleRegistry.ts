import { AccessForm } from "@/components/briefing/forms/AccessForm";
import { ContactForm } from "@/components/briefing/forms/ContactForm";
import { DeliveryForm } from "@/components/briefing/forms/DeliveryForm";
import { EquipmentForm } from "@/components/briefing/forms/EquipmentForm";
import { NotesForm } from "@/components/briefing/forms/NotesForm";
import { StaffForm } from "@/components/briefing/forms/StaffForm";
import { VehicleForm } from "@/components/briefing/forms/VehicleForm";
import { ContactPreview } from "@/components/briefing/preview/ContactPreview";
import { EquipmentPreview } from "@/components/briefing/preview/EquipmentPreview";
import { StaffPreview } from "@/components/briefing/preview/StaffPreview";
import { VehiclePreview } from "@/components/briefing/preview/VehiclePreview";
import { moduleCatalog } from "@/lib/moduleCatalog";
import {
  ModuleKey,
  ModuleRegistryEntry
} from "@/lib/types";
import { AccessModulePreview } from "@/modules/access/access.render";
import {
  deliveryFieldDefinitions,
  deliverySettingsDefinitions
} from "@/modules/delivery/delivery.types";
import { DeliveryModulePreview } from "@/modules/delivery/delivery.render";
import { NotesModulePreview } from "@/modules/notes/notes.render";

export const moduleRegistry: { [K in ModuleKey]: ModuleRegistryEntry<K> } = {
  metadata: {
    ...moduleCatalog.metadata,
    FormComponent: () => null,
    PreviewComponent: () => null
  },
  access: {
    ...moduleCatalog.access,
    FormComponent: AccessForm,
    PreviewComponent: AccessModulePreview
  },
  delivery: {
    ...moduleCatalog.delivery,
    FormComponent: DeliveryForm,
    PreviewComponent: DeliveryModulePreview
  },
  vehicle: {
    ...moduleCatalog.vehicle,
    FormComponent: VehicleForm,
    PreviewComponent: VehiclePreview
  },
  equipment: {
    ...moduleCatalog.equipment,
    FormComponent: EquipmentForm,
    PreviewComponent: EquipmentPreview
  },
  staff: {
    ...moduleCatalog.staff,
    FormComponent: StaffForm,
    PreviewComponent: StaffPreview
  },
  notes: {
    ...moduleCatalog.notes,
    FormComponent: NotesForm,
    PreviewComponent: NotesModulePreview
  },
  contact: {
    ...moduleCatalog.contact,
    FormComponent: ContactForm,
    PreviewComponent: ContactPreview
  }
};

export const moduleEntries = (Object.values(moduleRegistry) as ModuleRegistryEntry<ModuleKey>[]).sort(
  (a, b) => a.order - b.order
);

export { deliveryFieldDefinitions, deliverySettingsDefinitions };
