import { EquipmentData } from "@/lib/types";
import { ModulePdfContext, ModulePublicSection, compact, localizeField, renderPdfEmptyState, renderPdfRows } from "@/modules/shared";
import { EQUIPMENT_PDF_LABELS, EquipmentPdfField } from "@/modules/equipment/equipment.i18n";

function l(field: EquipmentPdfField, lang: ModulePdfContext["lang"] = "fr") {
  return localizeField(EQUIPMENT_PDF_LABELS, field, lang);
}

export function renderEquipmentPdf(value: EquipmentData, context?: ModulePdfContext): string {
  if (!value.items_text.trim()) return renderPdfEmptyState();
  const lang = context?.lang ?? "fr";
  return renderPdfRows([{ label: l("items_text", lang), value: value.items_text }]);
}

export function buildEquipmentPublicSection(value: EquipmentData): ModulePublicSection | null {
  const items = compact([value.items_text]);
  return items.length ? { id: "material", title: "Equipment", items } : null;
}
