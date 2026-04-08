import { ComponentType } from "react";

import { AccessData, DeliveryData, ModuleKey, ModulePreviewProps, NotesData } from "@/lib/types";
import { buildAccessPublicSection, renderAccessPdf } from "@/modules/access/access.pdf";
import { AccessModulePreview } from "@/modules/access/access.render";
import { buildDeliveryPublicSection, renderDeliveryPdf } from "@/modules/delivery/delivery.pdf";
import { DeliveryModulePreview } from "@/modules/delivery/delivery.render";
import { buildNotesPublicSection, renderNotesPdf } from "@/modules/notes/notes.pdf";
import { NotesModulePreview } from "@/modules/notes/notes.render";
import { ModulePdfContext, ModulePublicSection } from "@/modules/shared";

type SupportedModulePresentationMap = {
  access: AccessData;
  delivery: DeliveryData;
  notes: NotesData;
};

type ModulePresentation<K extends keyof SupportedModulePresentationMap> = {
  PreviewComponent: ComponentType<ModulePreviewProps<SupportedModulePresentationMap[K]>>;
  renderPdf: (value: SupportedModulePresentationMap[K], context?: ModulePdfContext) => string;
  buildPublicSection?: (value: SupportedModulePresentationMap[K]) => ModulePublicSection | null;
};

export const modulePresentations: {
  [K in keyof SupportedModulePresentationMap]: ModulePresentation<K>;
} = {
  access: {
    PreviewComponent: AccessModulePreview,
    renderPdf: renderAccessPdf,
    buildPublicSection: buildAccessPublicSection
  },
  delivery: {
    PreviewComponent: DeliveryModulePreview,
    renderPdf: renderDeliveryPdf,
    buildPublicSection: buildDeliveryPublicSection
  },
  notes: {
    PreviewComponent: NotesModulePreview,
    renderPdf: renderNotesPdf,
    buildPublicSection: buildNotesPublicSection
  }
};

export function hasModulePresentation(key: ModuleKey | string): key is keyof typeof modulePresentations {
  return key in modulePresentations;
}

