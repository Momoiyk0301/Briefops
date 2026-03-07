import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type BriefingPayload = {
  id: string;
  title: string;
  event_date: string | null;
  location_text: string | null;
  modules: Array<{
    module_key: string;
    enabled: boolean;
    data_json: Record<string, unknown>;
  }>;
};

type CanonicalPayload = {
  metadata?: {
    label?: string;
    enabled?: boolean;
  };
  audience?: {
    visibility?: "visible" | "hidden" | string;
  };
  data?: unknown;
};

type PrintableModule = {
  label: string;
  rows: Array<{ key: string; value: string }>;
};

export async function renderBriefingPdf(input: BriefingPayload): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]);
  const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
  const muted = rgb(0.4, 0.42, 0.48);

  let y = 800;
  const left = 46;
  const contentWidth = 500;
  const lineHeight = 14;
  const sectionGap = 10;

  page.drawText("Event Briefing", {
    x: left,
    y,
    size: 22,
    font: titleFont,
    color: rgb(0.1, 0.1, 0.1)
  });

  y -= 26;
  page.drawText(`Title: ${input.title || "Untitled briefing"}`, { x: left, y, size: 11, font: bodyFont, color: muted });
  y -= 16;
  page.drawText(`Date: ${input.event_date ?? "N/A"}`, { x: left, y, size: 11, font: bodyFont, color: muted });
  y -= 16;
  page.drawText(`Location: ${input.location_text ?? "N/A"}`, { x: left, y, size: 11, font: bodyFont, color: muted });

  y -= 22;
  page.drawLine({
    start: { x: left, y },
    end: { x: left + contentWidth, y },
    thickness: 1,
    color: rgb(0.88, 0.9, 0.94)
  });
  y -= 18;
  page.drawText("Modules", { x: left, y, size: 14, font: titleFont });
  y -= 16;

  const printableModules = input.modules
    .map((mod) => toPrintableModule(mod))
    .filter((mod): mod is PrintableModule => Boolean(mod));

  if (printableModules.length === 0) {
    page.drawText("No active modules.", { x: left, y, size: 10.5, font: bodyFont, color: muted });
    return pdf.save();
  }

  for (const mod of printableModules) {
    if (y < 80) {
      page = pdf.addPage([595, 842]);
      y = 800;
    }

    page.drawText(mod.label, { x: left, y, size: 12, font: titleFont, color: rgb(0.08, 0.13, 0.2) });
    y -= 14;

    for (const row of mod.rows) {
      const label = `${row.key}: `;
      const wrapped = wrapText(row.value, 72);

      if (y < 70) {
        page = pdf.addPage([595, 842]);
        y = 800;
      }

      page.drawText(label, { x: left, y, size: 10, font: titleFont, color: rgb(0.2, 0.25, 0.32) });
      page.drawText(wrapped[0] ?? "-", { x: left + 100, y, size: 10, font: bodyFont, color: rgb(0.17, 0.17, 0.17) });
      y -= lineHeight;

      for (const continued of wrapped.slice(1)) {
        if (y < 70) {
          page = pdf.addPage([595, 842]);
          y = 800;
        }
        page.drawText(continued, { x: left + 100, y, size: 10, font: bodyFont, color: rgb(0.17, 0.17, 0.17) });
        y -= lineHeight;
      }
    }

    y -= sectionGap;
  }

  return pdf.save();
}

function toPrintableModule(mod: BriefingPayload["modules"][number]): PrintableModule | null {
  if (!mod.enabled) return null;

  const parsed = parseCanonical(mod.data_json);
  if (!parsed.visible) return null;

  const rows = flattenData(parsed.data);
  return {
    label: parsed.label || humanize(mod.module_key),
    rows: rows.length > 0 ? rows : [{ key: "Details", value: "No details provided" }]
  };
}

function parseCanonical(value: unknown): { label: string; visible: boolean; data: unknown } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { label: "", visible: true, data: value };
  }

  const raw = value as CanonicalPayload;
  const visible = raw.metadata?.enabled !== false && raw.audience?.visibility !== "hidden";
  return {
    label: raw.metadata?.label ?? "",
    visible,
    data: raw.data ?? value
  };
}

function flattenData(data: unknown, prefix = ""): Array<{ key: string; value: string }> {
  if (data == null) return [];

  if (Array.isArray(data)) {
    if (data.length === 0) return [{ key: prefix || "Items", value: "-" }];
    return data.map((item, index) => ({
      key: `${prefix || "Item"} ${index + 1}`,
      value: formatValue(item)
    }));
  }

  if (typeof data !== "object") {
    return [{ key: prefix || "Value", value: formatValue(data) }];
  }

  const rows: Array<{ key: string; value: string }> = [];
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const nextKey = prefix ? `${prefix} ${humanize(key)}` : humanize(key);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      rows.push(...flattenData(value, nextKey));
    } else {
      rows.push({ key: nextKey, value: formatValue(value) });
    }
  }
  return rows;
}

function formatValue(value: unknown): string {
  if (value == null) return "-";
  if (typeof value === "string") return value.trim() || "-";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.length === 0 ? "-" : value.map((item) => formatValue(item)).join(" | ");
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function wrapText(text: string, maxChars: number): string[] {
  if (!text) return ["-"];
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [text];
}

function humanize(key: string): string {
  return key
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
