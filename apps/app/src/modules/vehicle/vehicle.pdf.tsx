import { VehicleData } from "@/lib/types";
import { ModulePdfContext, ModulePublicSection, compact, escapeHtml, localizeField, renderPdfEmptyState } from "@/modules/shared";
import { VEHICLE_PDF_LABELS, VehiclePdfField } from "@/modules/vehicle/vehicle.i18n";

function l(field: VehiclePdfField, lang: ModulePdfContext["lang"] = "fr") {
  return localizeField(VEHICLE_PDF_LABELS, field, lang);
}

export function renderVehiclePdf(value: VehicleData, context?: ModulePdfContext): string {
  if (!value.vehicles.length) return renderPdfEmptyState();
  const lang = context?.lang ?? "fr";

  return value.vehicles
    .map((vehicle, index) => {
      const rows = [
        { label: l("type", lang),           value: vehicle.type },
        { label: l("plate", lang),          value: vehicle.plate },
        { label: l("pickup_address", lang), value: vehicle.pickup_address },
        { label: l("pickup_time", lang),    value: vehicle.pickup_time },
        { label: l("return_address", lang), value: vehicle.return_address },
        { label: l("notes", lang),          value: vehicle.notes },
      ].filter((row) => row.value.trim());

      const rowsHtml = rows.map((row) => `
        <div class="row">
          <div class="label">${escapeHtml(row.label)}</div>
          <div class="value">${escapeHtml(row.value)}</div>
        </div>
      `).join("");

      return `
        <article class="pdf-card">
          <div class="pdf-kicker">${escapeHtml(`#${index + 1}`)}</div>
          ${rowsHtml || `<p class="muted">-</p>`}
        </article>
      `;
    })
    .join("\n");
}

export function buildVehiclePublicSection(value: VehicleData): ModulePublicSection | null {
  const items = value.vehicles.flatMap((v) =>
    compact([
      v.type || v.plate ? `${v.type}${v.plate ? ` · ${v.plate}` : ""}` : null,
      v.pickup_address ? `Départ: ${v.pickup_address}${v.pickup_time ? ` à ${v.pickup_time}` : ""}` : null,
      v.return_address ? `Retour: ${v.return_address}` : null,
    ])
  );
  return items.length ? { id: "material", title: "Vehicles", items } : null;
}
