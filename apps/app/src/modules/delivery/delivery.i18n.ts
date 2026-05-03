import type { PdfLang, ModulePdfLabels } from "@/modules/shared";

export type DeliveryPdfField =
  | "destination"
  | "time"
  | "contact"
  | "notes"
  | "tag_depot"
  | "tag_retour"
  | "tag_custom";

export const DELIVERY_PDF_LABELS: ModulePdfLabels<DeliveryPdfField> = {
  destination: { fr: "Destination",  en: "Destination", nl: "Bestemming" },
  time:        { fr: "Horaire",      en: "Time",        nl: "Tijdstip" },
  contact:     { fr: "Contact",      en: "Contact",     nl: "Contact" },
  notes:       { fr: "Consignes",    en: "Notes",       nl: "Notities" },
  tag_depot:   { fr: "Dépôt",        en: "Depot",       nl: "Depot" },
  tag_retour:  { fr: "Retour",       en: "Return",      nl: "Retour" },
  tag_custom:  { fr: "Personnalisé", en: "Custom",      nl: "Aangepast" },
};

export function deliveryLabel(field: DeliveryPdfField, lang: PdfLang = "fr"): string {
  return DELIVERY_PDF_LABELS[field][lang];
}
