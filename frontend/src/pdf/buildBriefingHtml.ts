import { getDesktopPage, getPageCountFromLayouts } from "@/lib/briefingPages";
import { hasServerModulePresentation, serverModulePresentations } from "@/modules/server";
import { escapeHtml, humanizeModuleKey, renderPdfRows } from "@/modules/shared";
import { gridRectToInlineStyle } from "@/pdf/layoutToHtml";

type CanonicalModulePayload = {
  metadata?: {
    enabled?: boolean;
  };
  audience?: {
    mode?: "all" | "teams" | string;
    teams?: string[];
    visibility?: "visible" | "hidden" | string;
  };
  layout?: {
    desktop?: {
      x?: number;
      y?: number;
      w?: number;
      h?: number;
    };
  };
  data?: unknown;
};

type ModuleInput = {
  module_key: string;
  enabled: boolean;
  data_json: unknown;
};

type BriefingHtmlInput = {
  id: string;
  title: string;
  event_date: string | null;
  location_text: string | null;
  team?: string | null;
  watermark?: boolean | string;
  modules: ModuleInput[];
};

function moduleDataToObject(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object") return {};
  if (Array.isArray(data)) return { items: data };

  const raw = data as Record<string, unknown>;
  return raw;
}

function flattenData(value: unknown, prefix = ""): Array<{ key: string; value: unknown }> {
  if (value == null) return [];
  if (Array.isArray(value)) return [{ key: prefix || "items", value }];
  if (typeof value !== "object") return prefix ? [{ key: prefix, value }] : [];

  const out: Array<{ key: string; value: unknown }> = [];
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      out.push(...flattenData(entry, nextPrefix));
    } else {
      out.push({ key: nextPrefix, value: entry });
    }
  }
  return out;
}

function renderObjectRows(value: Record<string, unknown>): string {
  const entries = flattenData(value);
  return renderPdfRows(entries.map(({ key, value: val }) => ({
    label: humanizeModuleKey(key),
    value: typeof val === "string"
      ? val
      : val == null
        ? "-"
        : Array.isArray(val)
          ? val.length
            ? val.map((entry) => (typeof entry === "string" ? entry : JSON.stringify(entry))).join(", ")
            : "-"
          : JSON.stringify(val)
  })));
}

function parseModuleShape(module: ModuleInput): {
  moduleKey: string;
  enabled: boolean;
  layoutDesktop: { x?: number; y?: number; w?: number; h?: number; page?: number } | undefined;
  data: Record<string, unknown>;
} {
  const raw = module.data_json as CanonicalModulePayload | Record<string, unknown> | null;
  if (raw && typeof raw === "object" && "data" in raw && "layout" in raw) {
    const canonical = raw as CanonicalModulePayload;
    const enabledFromMetadata = canonical.metadata?.enabled !== false;
    const visible = canonical.audience?.visibility !== "hidden";
    return {
      moduleKey: module.module_key,
      enabled: module.enabled && enabledFromMetadata && visible,
      layoutDesktop: canonical.layout?.desktop,
      data: moduleDataToObject(canonical.data)
    };
  }

  return {
    moduleKey: module.module_key,
    enabled: module.enabled,
    layoutDesktop: undefined,
    data: moduleDataToObject(module.data_json)
  };
}

function normalizeTeamKey(team?: string | null) {
  if (!team) return null;
  const normalized = team
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || null;
}

function renderModuleBody(moduleKey: string, data: Record<string, unknown>) {
  if (hasServerModulePresentation(moduleKey)) {
    return serverModulePresentations[moduleKey].renderPdf(data as never, { moduleKey });
  }

  return renderObjectRows(data);
}

export function buildBriefingHtml(input: BriefingHtmlInput): string {
  const targetTeam = normalizeTeamKey(input.team);
  const activeModules = input.modules
    .map((module) => {
      const parsed = parseModuleShape(module);
      if (!parsed.enabled) return null;

      if (!targetTeam) return parsed;
      if (!module.data_json || typeof module.data_json !== "object" || Array.isArray(module.data_json)) return parsed;

      const raw = module.data_json as CanonicalModulePayload;
      if (raw.audience?.mode !== "teams") return parsed;
      const teams = Array.isArray(raw.audience.teams) ? raw.audience.teams : [];
      const hasTeam = teams.some((team) => normalizeTeamKey(team) === targetTeam);
      return hasTeam ? parsed : null;
    })
    .filter((module): module is NonNullable<typeof module> => Boolean(module));
  const title = input.title?.trim() || "Untitled briefing";
  const titleWithTeam = targetTeam ? `${title} - team ${targetTeam}` : title;
  const eventDate = input.event_date || "Not set";
  const location = input.location_text || "Not set";
  const pageCount = getPageCountFromLayouts(activeModules.map((module) => module.layoutDesktop));
  const watermarkLabel = input.watermark ? escapeHtml(typeof input.watermark === "string" ? input.watermark : "BriefOps Starter") : null;
  const pages = Array.from({ length: pageCount }, (_, pageIndex) => {
    const pageModules = activeModules.filter((module) => getDesktopPage(module.layoutDesktop) === pageIndex);
    const moduleSections = pageModules.length
      ? pageModules
          .map((module, index) => {
            return `
              <section class="module" data-page="${pageIndex + 1}" data-module-index="${index + 1}" style="${gridRectToInlineStyle(module.layoutDesktop)}">
                <div class="module-title">${escapeHtml(humanizeModuleKey(module.moduleKey))}</div>
                ${renderModuleBody(module.moduleKey, module.data)}
              </section>
            `;
          })
          .join("\n")
      : '<section class="module module-empty"><p class="muted">No active modules on this page.</p></section>';

    return `
      <section class="pdf-page">
        ${watermarkLabel ? `<div class="watermark">${watermarkLabel}</div>` : ""}
        ${pageIndex === 0 ? `
          <header class="header">
            <h1>${escapeHtml(titleWithTeam)}</h1>
            <div class="muted">Briefing ID: ${escapeHtml(input.id)}</div>
            <div class="meta">
              <div><strong>Date:</strong> ${escapeHtml(eventDate)}</div>
              <div><strong>Location:</strong> ${escapeHtml(location)}</div>
            </div>
          </header>
        ` : `<div class="page-marker">Page ${pageIndex + 1}</div>`}
        <main class="canvas">
          ${moduleSections}
        </main>
        <footer class="footer">Page ${pageIndex + 1} / ${pageCount}</footer>
      </section>
    `;
  }).join("\n");

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1f2937;
      font-size: 12px;
      line-height: 1.4;
      background: #fff;
    }
    .pdf-page {
      min-height: 269mm;
      page-break-after: always;
      break-after: page;
      position: relative;
    }
    .pdf-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .header {
      margin-bottom: 14px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 10px;
    }
    .header h1 {
      margin: 0 0 4px;
      font-size: 20px;
    }
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 8px;
    }
    .canvas {
      position: relative;
      width: 100%;
      height: 232mm;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      background: #fff;
    }
    .module {
      position: absolute;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px;
      overflow: hidden;
      background: #fff;
    }
    .module-title {
      margin-bottom: 6px;
      font-size: 11px;
      font-weight: 700;
      color: #111827;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .row {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 8px;
      border-top: 1px dashed #e5e7eb;
      padding-top: 6px;
      margin-top: 6px;
      font-size: 11px;
    }
    .row:first-of-type {
      border-top: none;
      margin-top: 0;
      padding-top: 0;
    }
    .label {
      font-weight: 600;
      color: #374151;
    }
    .value {
      color: #111827;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .pdf-card {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 10px;
      margin-top: 8px;
      background: #f8fafc;
    }
    .pdf-card:first-child {
      margin-top: 0;
    }
    .pdf-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 8px;
    }
    .pdf-kicker {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #64748b;
    }
    .pdf-destination {
      margin-top: 4px;
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .pdf-meta {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 6px;
    }
    .pdf-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      background: #e2e8f0;
      padding: 4px 8px;
      font-size: 10px;
      font-weight: 700;
      color: #334155;
    }
    .pdf-badge-accent {
      background: #fef3c7;
      color: #92400e;
    }
    .pdf-card-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .pdf-card-panel {
      border-radius: 8px;
      background: #fff;
      padding: 8px;
    }
    .muted { color: #6b7280; }
    .module-empty {
      position: static;
      margin-top: 8px;
    }
    .page-marker {
      margin-bottom: 8px;
      color: #6b7280;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .footer {
      margin-top: 10px;
      color: #6b7280;
      font-size: 11px;
      text-align: right;
    }
    .watermark {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: rgba(37, 99, 235, 0.09);
      transform: rotate(-28deg);
      pointer-events: none;
      text-transform: uppercase;
      z-index: 0;
    }
    .header, .canvas, .footer, .page-marker {
      position: relative;
      z-index: 1;
    }
  </style>
</head>
<body>
  ${pages}
</body>
</html>
  `.trim();
}

export type { BriefingHtmlInput };
