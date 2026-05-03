import type { PdfLang, ModulePdfLabels } from "@/modules/shared";

export type ContactPdfField = "name" | "role" | "phone" | "email";

export const CONTACT_PDF_LABELS: ModulePdfLabels<ContactPdfField> = {
  name:  { fr: "Nom",       en: "Name",  nl: "Naam" },
  role:  { fr: "Rôle",      en: "Role",  nl: "Rol" },
  phone: { fr: "Téléphone", en: "Phone", nl: "Telefoon" },
  email: { fr: "Email",     en: "Email", nl: "E-mail" },
};

export function contactLabel(field: ContactPdfField, lang: PdfLang = "fr"): string {
  return CONTACT_PDF_LABELS[field][lang];
}
