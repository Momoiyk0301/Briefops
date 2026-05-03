import { AccessData, ContactData, DeliveryData, EquipmentData, MetadataExtra, ModuleKey, NotesData, StaffData, VehicleData } from "@/lib/types";
import { buildAccessPublicSection, renderAccessPdf } from "@/modules/access/access.pdf";
import { buildContactPublicSection, renderContactPdf } from "@/modules/contact/contact.pdf";
import { buildDeliveryPublicSection, renderDeliveryPdf } from "@/modules/delivery/delivery.pdf";
import { buildEquipmentPublicSection, renderEquipmentPdf } from "@/modules/equipment/equipment.pdf";
import { buildMetadataPublicSection, renderMetadataPdf } from "@/modules/metadata/metadata.pdf";
import { buildNotesPublicSection, renderNotesPdf } from "@/modules/notes/notes.pdf";
import { buildStaffPublicSection, renderStaffPdf } from "@/modules/staff/staff.pdf";
import { buildVehiclePublicSection, renderVehiclePdf } from "@/modules/vehicle/vehicle.pdf";
import { ModulePdfContext, ModulePublicSection } from "@/modules/shared";

type SupportedServerModuleMap = {
  metadata: MetadataExtra;
  access: AccessData;
  delivery: DeliveryData;
  vehicle: VehicleData;
  equipment: EquipmentData;
  staff: StaffData;
  notes: NotesData;
  contact: ContactData;
};

type ServerModulePresentation<K extends keyof SupportedServerModuleMap> = {
  renderPdf: (value: SupportedServerModuleMap[K], context?: ModulePdfContext) => string;
  buildPublicSection?: (value: SupportedServerModuleMap[K]) => ModulePublicSection | null;
};

export const serverModulePresentations: {
  [K in keyof SupportedServerModuleMap]: ServerModulePresentation<K>;
} = {
  metadata: {
    renderPdf: renderMetadataPdf,
    buildPublicSection: buildMetadataPublicSection,
  },
  access: {
    renderPdf: renderAccessPdf,
    buildPublicSection: buildAccessPublicSection,
  },
  delivery: {
    renderPdf: renderDeliveryPdf,
    buildPublicSection: buildDeliveryPublicSection,
  },
  vehicle: {
    renderPdf: renderVehiclePdf,
    buildPublicSection: buildVehiclePublicSection,
  },
  equipment: {
    renderPdf: renderEquipmentPdf,
    buildPublicSection: buildEquipmentPublicSection,
  },
  staff: {
    renderPdf: renderStaffPdf,
    buildPublicSection: buildStaffPublicSection,
  },
  notes: {
    renderPdf: renderNotesPdf,
    buildPublicSection: buildNotesPublicSection,
  },
  contact: {
    renderPdf: renderContactPdf,
    buildPublicSection: buildContactPublicSection,
  },
};

export function hasServerModulePresentation(key: ModuleKey | string): key is keyof typeof serverModulePresentations {
  return key in serverModulePresentations;
}
