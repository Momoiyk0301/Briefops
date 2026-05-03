import type { PdfLang, ModulePdfLabels } from "@/modules/shared";

export type StaffPdfField = "role" | "count" | "notes";

export const STAFF_PDF_LABELS: ModulePdfLabels<StaffPdfField> = {
  role:  { fr: "Rôle",     en: "Role",  nl: "Rol" },
  count: { fr: "Effectif", en: "Count", nl: "Aantal" },
  notes: { fr: "Notes",    en: "Notes", nl: "Notities" },
};

export function staffLabel(field: StaffPdfField, lang: PdfLang = "fr"): string {
  return STAFF_PDF_LABELS[field][lang];
}
