import type { PdfLang, ModulePdfLabels } from "@/modules/shared";

export type MetadataPdfField =
  | "main_contact_name"
  | "main_contact_phone"
  | "global_notes"
  | "team_mode"
  | "teams";

export const METADATA_PDF_LABELS: ModulePdfLabels<MetadataPdfField> = {
  main_contact_name:  { fr: "Contact principal",  en: "Main contact",   nl: "Hoofdcontact" },
  main_contact_phone: { fr: "Téléphone",           en: "Phone",          nl: "Telefoon" },
  global_notes:       { fr: "Notes générales",     en: "General notes",  nl: "Algemene notities" },
  team_mode:          { fr: "Mode équipes",         en: "Team mode",      nl: "Teamsmodus" },
  teams:              { fr: "Équipes",              en: "Teams",          nl: "Teams" },
};

export function metadataLabel(field: MetadataPdfField, lang: PdfLang = "fr"): string {
  return METADATA_PDF_LABELS[field][lang];
}
