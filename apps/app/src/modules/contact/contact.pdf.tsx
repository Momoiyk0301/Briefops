import { ContactData } from "@/lib/types";
import { ModulePdfContext, ModulePublicSection, compact, escapeHtml, localizeField, renderPdfEmptyState } from "@/modules/shared";
import { CONTACT_PDF_LABELS, ContactPdfField } from "@/modules/contact/contact.i18n";

function l(field: ContactPdfField, lang: ModulePdfContext["lang"] = "fr") {
  return localizeField(CONTACT_PDF_LABELS, field, lang);
}

export function renderContactPdf(value: ContactData, context?: ModulePdfContext): string {
  if (!value.people.length) return renderPdfEmptyState();
  const lang = context?.lang ?? "fr";

  return value.people
    .map((person) => {
      const rows = [
        { label: l("role", lang),  value: person.role },
        { label: l("phone", lang), value: person.phone },
        { label: l("email", lang), value: person.email },
      ].filter((row) => row.value.trim());

      const rowsHtml = rows.map((row) => `
        <div class="row">
          <div class="label">${escapeHtml(row.label)}</div>
          <div class="value">${escapeHtml(row.value)}</div>
        </div>
      `).join("");

      return `
        <article class="pdf-card">
          <div class="pdf-destination">${escapeHtml(person.name || "-")}</div>
          ${rowsHtml}
        </article>
      `;
    })
    .join("\n");
}

export function buildContactPublicSection(value: ContactData): ModulePublicSection | null {
  const items = value.people
    .filter((p) => p.name.trim())
    .flatMap((p) =>
      compact([
        p.name + (p.role ? ` — ${p.role}` : ""),
        p.phone || null,
        p.email || null,
      ])
    );
  return items.length ? { id: "contacts", title: "Contacts", items } : null;
}
