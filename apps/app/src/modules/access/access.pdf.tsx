import { AccessData } from "@/lib/types";
import { ModulePdfContext, ModulePublicSection, compact, localizeField, renderPdfRows } from "@/modules/shared";
import { ACCESS_PDF_LABELS, AccessPdfField } from "@/modules/access/access.i18n";

function l(field: AccessPdfField, lang: ModulePdfContext["lang"] = "fr") {
  return localizeField(ACCESS_PDF_LABELS, field, lang);
}

export function renderAccessPdf(value: AccessData, context?: ModulePdfContext): string {
  const lang = context?.lang ?? "fr";
  return renderPdfRows([
    { label: l("address", lang),         value: value.address },
    { label: l("entrance", lang),        value: value.entrance },
    { label: l("parking", lang),         value: value.parking },
    { label: l("on_site_contact", lang), value: value.on_site_contact },
  ]);
}

export function buildAccessPublicSection(value: AccessData): ModulePublicSection | null {
  const items = compact([
    value.address ? `Adresse: ${value.address}` : null,
    value.entrance ? `Entrée: ${value.entrance}` : null,
    value.parking ? `Parking: ${value.parking}` : null,
    value.on_site_contact ? `Contact sur site: ${value.on_site_contact}` : null,
  ]);
  return items.length ? { id: "access", title: "Accès", items } : null;
}
