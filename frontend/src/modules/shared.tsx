import { ModuleKey } from "@/lib/types";

export type ModulePdfContext = {
  moduleKey: ModuleKey | string;
};

export type ModulePublicSection = {
  id: "access" | "schedule" | "mission" | "contacts" | "material" | "notes";
  title: string;
  items: string[];
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function compact(values: Array<string | null | undefined>) {
  return values.map((value) => (value ?? "").trim()).filter(Boolean);
}

export function humanizeModuleKey(key: string): string {
  return key
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function renderPdfEmptyState(message = "No data") {
  return `<p class="muted">${escapeHtml(message)}</p>`;
}

export function renderPdfRows(rows: Array<{ label: string; value: string | null | undefined }>) {
  const visibleRows = rows.filter((row) => (row.value ?? "").trim().length > 0);
  if (!visibleRows.length) return renderPdfEmptyState();

  return visibleRows
    .map((row) => {
      return `
        <div class="row">
          <div class="label">${escapeHtml(row.label)}</div>
          <div class="value">${escapeHtml(String(row.value ?? "-"))}</div>
        </div>
      `;
    })
    .join("\n");
}

