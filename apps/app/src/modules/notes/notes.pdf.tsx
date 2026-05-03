import { NotesData } from "@/lib/types";
import { ModulePdfContext, ModulePublicSection, compact, localizeField, renderPdfEmptyState, renderPdfRows } from "@/modules/shared";
import { NOTES_PDF_LABELS, NotesPdfField } from "@/modules/notes/notes.i18n";

function l(field: NotesPdfField, lang: ModulePdfContext["lang"] = "fr") {
  return localizeField(NOTES_PDF_LABELS, field, lang);
}

export function renderNotesPdf(value: NotesData, context?: ModulePdfContext): string {
  if (!value.text.trim()) return renderPdfEmptyState();
  const lang = context?.lang ?? "fr";
  return renderPdfRows([{ label: l("text", lang), value: value.text }]);
}

export function buildNotesPublicSection(value: NotesData): ModulePublicSection | null {
  const items = compact([value.text]);
  return items.length ? { id: "notes", title: "Notes", items } : null;
}
