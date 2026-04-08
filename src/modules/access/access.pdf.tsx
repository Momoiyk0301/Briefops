import { AccessData } from "@/lib/types";
import { ModulePdfContext, ModulePublicSection, compact, renderPdfRows } from "@/modules/shared";

export function renderAccessPdf(value: AccessData, _context?: ModulePdfContext) {
  return renderPdfRows([
    { label: "Address", value: value.address },
    { label: "Entrance", value: value.entrance },
    { label: "Parking", value: value.parking },
    { label: "On-site contact", value: value.on_site_contact }
  ]);
}

export function buildAccessPublicSection(value: AccessData): ModulePublicSection | null {
  const items = compact([
    value.address ? `Adresse: ${value.address}` : null,
    value.entrance ? `Entrée: ${value.entrance}` : null,
    value.parking ? `Parking: ${value.parking}` : null,
    value.on_site_contact ? `Contact sur site: ${value.on_site_contact}` : null
  ]);

  return items.length ? { id: "access", title: "Access", items } : null;
}

