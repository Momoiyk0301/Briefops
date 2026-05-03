import type { PdfLang, ModulePdfLabels } from "@/modules/shared";

export type EquipmentPdfField = "items_text";

export const EQUIPMENT_PDF_LABELS: ModulePdfLabels<EquipmentPdfField> = {
  items_text: { fr: "Matériel", en: "Equipment", nl: "Materiaal" },
};

export function equipmentLabel(field: EquipmentPdfField, lang: PdfLang = "fr"): string {
  return EQUIPMENT_PDF_LABELS[field][lang];
}
