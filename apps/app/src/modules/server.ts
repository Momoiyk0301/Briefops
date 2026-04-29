import { AccessData, DeliveryData, ModuleKey, NotesData } from "@/lib/types";
import { buildAccessPublicSection, renderAccessPdf } from "@/modules/access/access.pdf";
import { buildDeliveryPublicSection, renderDeliveryPdf } from "@/modules/delivery/delivery.pdf";
import { buildNotesPublicSection, renderNotesPdf } from "@/modules/notes/notes.pdf";
import { ModulePdfContext, ModulePublicSection } from "@/modules/shared";

type SupportedServerModuleMap = {
  access: AccessData;
  delivery: DeliveryData;
  notes: NotesData;
};

type ServerModulePresentation<K extends keyof SupportedServerModuleMap> = {
  renderPdf: (value: SupportedServerModuleMap[K], context?: ModulePdfContext) => string;
  buildPublicSection?: (value: SupportedServerModuleMap[K]) => ModulePublicSection | null;
};

export const serverModulePresentations: {
  [K in keyof SupportedServerModuleMap]: ServerModulePresentation<K>;
} = {
  access: {
    renderPdf: renderAccessPdf,
    buildPublicSection: buildAccessPublicSection
  },
  delivery: {
    renderPdf: renderDeliveryPdf,
    buildPublicSection: buildDeliveryPublicSection
  },
  notes: {
    renderPdf: renderNotesPdf,
    buildPublicSection: buildNotesPublicSection
  }
};

export function hasServerModulePresentation(key: ModuleKey | string): key is keyof typeof serverModulePresentations {
  return key in serverModulePresentations;
}
