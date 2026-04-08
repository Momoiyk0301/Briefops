import { NotesData } from "@/lib/types";
import { ModulePdfContext, ModulePublicSection, compact, renderPdfEmptyState, renderPdfRows } from "@/modules/shared";

export function renderNotesPdf(value: NotesData, _context?: ModulePdfContext) {
  if (!value.text.trim()) return renderPdfEmptyState();

  return renderPdfRows([{ label: "Notes", value: value.text }]);
}

export function buildNotesPublicSection(value: NotesData): ModulePublicSection | null {
  const items = compact([value.text]);
  return items.length ? { id: "notes", title: "Notes", items } : null;
}

