import { MetadataExtra } from "@/lib/types";
import { ModulePdfContext, ModulePublicSection, compact, localizeField, renderPdfEmptyState, renderPdfRows } from "@/modules/shared";
import { METADATA_PDF_LABELS, MetadataPdfField } from "@/modules/metadata/metadata.i18n";

function l(field: MetadataPdfField, lang: ModulePdfContext["lang"] = "fr") {
  return localizeField(METADATA_PDF_LABELS, field, lang);
}

export function renderMetadataPdf(value: MetadataExtra, context?: ModulePdfContext): string {
  const lang = context?.lang ?? "fr";
  const boolLabel = (v: boolean) => (lang === "nl" ? (v ? "Ja" : "Nee") : v ? "Oui" : "Non");

  const rows: Array<{ label: string; value: string }> = [];

  if (value.teams?.length) {
    rows.push({ label: l("teams", lang), value: value.teams.join(", ") });
  }
  if (value.team_mode !== undefined) {
    rows.push({ label: l("team_mode", lang), value: boolLabel(value.team_mode) });
  }
  if (value.main_contact_name?.trim()) {
    rows.push({ label: l("main_contact_name", lang), value: value.main_contact_name });
  }
  if (value.main_contact_phone?.trim()) {
    rows.push({ label: l("main_contact_phone", lang), value: value.main_contact_phone });
  }
  if (value.global_notes?.trim()) {
    rows.push({ label: l("global_notes", lang), value: value.global_notes });
  }

  return rows.length ? renderPdfRows(rows) : renderPdfEmptyState();
}

export function buildMetadataPublicSection(value: MetadataExtra): ModulePublicSection | null {
  const items = compact([
    value.main_contact_name ? `Contact: ${value.main_contact_name}` : null,
    value.main_contact_phone ? `Tél: ${value.main_contact_phone}` : null,
    value.global_notes
  ]);
  return items.length ? { id: "mission", title: "Metadata", items } : null;
}
