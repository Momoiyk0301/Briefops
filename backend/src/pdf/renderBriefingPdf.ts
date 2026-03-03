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

export async function renderBriefingPdf(input: BriefingPayload): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]);
  const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);

  let y = 800;

  page.drawText("Event Briefing", {
    x: 50,
    y,
    size: 24,
    font: titleFont,
    color: rgb(0.1, 0.1, 0.1)
  });

  y -= 36;
  page.drawText(`Title: ${input.title}`, { x: 50, y, size: 12, font: bodyFont });
  y -= 20;
  page.drawText(`Date: ${input.event_date ?? "N/A"}`, { x: 50, y, size: 12, font: bodyFont });
  y -= 20;
  page.drawText(`Location: ${input.location_text ?? "N/A"}`, { x: 50, y, size: 12, font: bodyFont });

  y -= 30;
  page.drawText("Modules", { x: 50, y, size: 16, font: titleFont });
  y -= 24;

  for (const mod of input.modules) {
    const serialized = JSON.stringify(mod.data_json);
    const line = `[${mod.enabled ? "on" : "off"}] ${mod.module_key}: ${serialized}`;

    const chunks = chunkText(line, 85);
    for (const chunk of chunks) {
      if (y < 60) {
        y = 800;
        page = pdf.addPage([595, 842]);
      }
      page.drawText(chunk, { x: 50, y, size: 10, font: bodyFont });
      y -= 16;
    }
    y -= 8;
  }

  return pdf.save();
}

function chunkText(text: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    out.push(text.slice(i, i + size));
  }
  return out;
}
