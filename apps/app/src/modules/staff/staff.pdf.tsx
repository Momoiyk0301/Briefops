import { StaffData } from "@/lib/types";
import { ModulePdfContext, ModulePublicSection, compact, escapeHtml, localizeField, renderPdfEmptyState } from "@/modules/shared";
import { STAFF_PDF_LABELS, StaffPdfField } from "@/modules/staff/staff.i18n";

function l(field: StaffPdfField, lang: ModulePdfContext["lang"] = "fr") {
  return localizeField(STAFF_PDF_LABELS, field, lang);
}

export function renderStaffPdf(value: StaffData, context?: ModulePdfContext): string {
  if (!value.roles.length) return renderPdfEmptyState();
  const lang = context?.lang ?? "fr";

  return value.roles
    .map((item) => {
      const rows = [
        { label: l("role", lang),  value: item.role },
        { label: l("count", lang), value: item.count > 0 ? String(item.count) : "" },
        { label: l("notes", lang), value: item.notes },
      ].filter((row) => row.value.trim());

      return `
        <div class="row">
          <div class="label">${escapeHtml(item.role || "-")}</div>
          <div class="value">${item.count > 0 ? escapeHtml(String(item.count)) : "-"}${item.notes.trim() ? ` · ${escapeHtml(item.notes)}` : ""}</div>
        </div>
      `;
    })
    .join("\n") || renderPdfEmptyState();
}

export function buildStaffPublicSection(value: StaffData): ModulePublicSection | null {
  const items = value.roles
    .filter((r) => r.role.trim())
    .map((r) => `${r.role}${r.count > 0 ? ` × ${r.count}` : ""}${r.notes ? ` — ${r.notes}` : ""}`);
  return items.length ? { id: "contacts", title: "Staff", items } : null;
}
