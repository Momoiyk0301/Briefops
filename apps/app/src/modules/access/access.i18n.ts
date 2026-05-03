import type { PdfLang, ModulePdfLabels } from "@/modules/shared";

export type AccessPdfField = "address" | "entrance" | "parking" | "on_site_contact";

export const ACCESS_PDF_LABELS: ModulePdfLabels<AccessPdfField> = {
  address:         { fr: "Adresse",          en: "Address",         nl: "Adres" },
  entrance:        { fr: "Accès / Entrée",   en: "Entrance",        nl: "Ingang" },
  parking:         { fr: "Parking",          en: "Parking",         nl: "Parkeren" },
  on_site_contact: { fr: "Contact sur site", en: "On-site contact", nl: "Contact ter plaatse" },
};

export function accessLabel(field: AccessPdfField, lang: PdfLang = "fr"): string {
  return ACCESS_PDF_LABELS[field][lang];
}
