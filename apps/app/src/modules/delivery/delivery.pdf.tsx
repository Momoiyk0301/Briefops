import { DeliveryData } from "@/lib/types";
import { ModulePdfContext, ModulePublicSection, compact, escapeHtml, localizeField, renderPdfEmptyState } from "@/modules/shared";
import { DELIVERY_PDF_LABELS, DeliveryPdfField } from "@/modules/delivery/delivery.i18n";

function l(field: DeliveryPdfField, lang: ModulePdfContext["lang"] = "fr") {
  return localizeField(DELIVERY_PDF_LABELS, field, lang);
}

function resolveTagLabel(tagMode?: string, customTag?: string, lang: ModulePdfContext["lang"] = "fr"): string | null {
  if (tagMode === "depot") return l("tag_depot", lang);
  if (tagMode === "retour") return l("tag_retour", lang);
  if (tagMode === "custom") return customTag?.trim() || l("tag_custom", lang);
  return null;
}

export function renderDeliveryPdf(value: DeliveryData, context?: ModulePdfContext): string {
  if (!value.deliveries.length) return renderPdfEmptyState();
  const lang = context?.lang ?? "fr";

  return value.deliveries
    .map((item, index) => {
      const tagLabel = resolveTagLabel(item.tag_mode, item.custom_tag, lang);

      return `
        <article class="pdf-card">
          <div class="pdf-card-header">
            <div>
              <div class="pdf-kicker">${escapeHtml(l("destination", lang))} ${index + 1}</div>
              <div class="pdf-destination">${escapeHtml(item.place || "-")}</div>
            </div>
            <div class="pdf-meta">
              <span class="pdf-badge">${escapeHtml(item.time || "-")}</span>
              ${tagLabel ? `<span class="pdf-badge pdf-badge-accent">${escapeHtml(tagLabel)}</span>` : ""}
            </div>
          </div>
          <div class="pdf-card-grid">
            <div class="pdf-card-panel">
              <div class="label">${escapeHtml(l("contact", lang))}</div>
              <div class="value">${escapeHtml(item.contact || "-")}</div>
            </div>
            <div class="pdf-card-panel">
              <div class="label">${escapeHtml(l("notes", lang))}</div>
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
      item.notes,
    ])
  );
  return items.length ? { id: "schedule", title: "Livraisons", items } : null;
}
