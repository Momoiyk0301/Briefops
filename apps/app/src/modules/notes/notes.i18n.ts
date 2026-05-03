import type { PdfLang, ModulePdfLabels } from "@/modules/shared";

export type NotesPdfField = "text";

export const NOTES_PDF_LABELS: ModulePdfLabels<NotesPdfField> = {
  text: { fr: "Notes", en: "Notes", nl: "Notities" },
};

export function notesLabel(field: NotesPdfField, lang: PdfLang = "fr"): string {
  return NOTES_PDF_LABELS[field][lang];
}
