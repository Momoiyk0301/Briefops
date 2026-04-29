import { DeliveryData } from "@/lib/types";
import { ModulePdfContext, ModulePublicSection, compact, escapeHtml, renderPdfEmptyState } from "@/modules/shared";

function resolveTagLabel(tagMode?: string, customTag?: string) {
  if (tagMode === "depot") return "Depot";
  if (tagMode === "retour") return "Retour";
  if (tagMode === "custom") return customTag?.trim() || "Custom";
  return null;
}

export function renderDeliveryPdf(value: DeliveryData, _context?: ModulePdfContext) {
  if (!value.deliveries.length) return renderPdfEmptyState();

  return value.deliveries
    .map((item, index) => {
      const tagLabel = resolveTagLabel(item.tag_mode, item.custom_tag);

      return `
        <article class="pdf-card">
          <div class="pdf-card-header">
            <div>
              <div class="pdf-kicker">Destination ${index + 1}</div>
              <div class="pdf-destination">${escapeHtml(item.place || "-")}</div>
            </div>
            <div class="pdf-meta">
              <span class="pdf-badge">${escapeHtml(item.time || "-")}</span>
              ${tagLabel ? `<span class="pdf-badge pdf-badge-accent">${escapeHtml(tagLabel)}</span>` : ""}
            </div>
          </div>
          <div class="pdf-card-grid">
            <div class="pdf-card-panel">
              <div class="label">Contact</div>
              <div class="value">${escapeHtml(item.contact || "-")}</div>
            </div>
            <div class="pdf-card-panel">
              <div class="label">Notes</div>
              <div class="value">${escapeHtml(item.notes || "-")}</div>
            </div>
          </div>
        </article>
      `;
    })
    .join("\n");
}

export function buildDeliveryPublicSection(value: DeliveryData): ModulePublicSection | null {
  const items = value.deliveries.flatMap((item) =>
    compact([
      item.time ? `${item.time} · ${item.place || "Lieu à confirmer"}` : item.place,
      item.contact ? `Contact: ${item.contact}` : null,
      item.notes
    ])
  );

  return items.length ? { id: "schedule", title: "Schedule", items } : null;
}

