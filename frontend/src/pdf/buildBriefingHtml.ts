import { gridRectToInlineStyle } from "@/pdf/layoutToHtml";

type CanonicalModulePayload = {
  metadata?: {
    enabled?: boolean;
  };
  audience?: {
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
  modules: ModuleInput[];
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function humanizeModuleKey(key: string): string {
  return key
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

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
  if (entries.length === 0) return '<p class="muted">No data</p>';

  return entries
    .map(({ key, value: val }) => {
      const label = humanizeModuleKey(key);
      const printed = typeof val === "string"
        ? val
        : val == null
          ? "-"
          : Array.isArray(val)
            ? val.length
              ? val.map((entry) => (typeof entry === "string" ? entry : JSON.stringify(entry))).join(", ")
              : "-"
            : JSON.stringify(val);

      return `
        <div class="row">
          <div class="label">${escapeHtml(label)}</div>
          <div class="value">${escapeHtml(String(printed || "-"))}</div>
        </div>
      `;
    })
    .join("\n");
}

function parseModuleShape(module: ModuleInput): {
  enabled: boolean;
  layoutDesktop: { x?: number; y?: number; w?: number; h?: number } | undefined;
  data: Record<string, unknown>;
} {
  const raw = module.data_json as CanonicalModulePayload | Record<string, unknown> | null;
  if (raw && typeof raw === "object" && "data" in raw && "layout" in raw) {
    const canonical = raw as CanonicalModulePayload;
    const enabledFromMetadata = canonical.metadata?.enabled !== false;
    const visible = canonical.audience?.visibility !== "hidden";
    return {
      enabled: module.enabled && enabledFromMetadata && visible,
      layoutDesktop: canonical.layout?.desktop,
      data: moduleDataToObject(canonical.data)
    };
  }

  return {
    enabled: module.enabled,
    layoutDesktop: undefined,
    data: moduleDataToObject(module.data_json)
  };
}

export function buildBriefingHtml(input: BriefingHtmlInput): string {
  const activeModules = input.modules.map(parseModuleShape).filter((module) => module.enabled);
  const title = input.title?.trim() || "Untitled briefing";
  const eventDate = input.event_date || "Not set";
  const location = input.location_text || "Not set";

  const moduleSections = activeModules.length
    ? activeModules
        .map((module, index) => {
          return `
            <section class="module" data-module-index="${index + 1}" style="${gridRectToInlineStyle(module.layoutDesktop)}">
              ${renderObjectRows(module.data)}
            </section>
          `;
        })
        .join("\n")
    : '<section class="module module-empty"><p class="muted">No active modules.</p></section>';

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
    .muted { color: #6b7280; }
    .module-empty {
      position: static;
      margin-top: 8px;
    }
    .footer {
      margin-top: 10px;
      color: #6b7280;
      font-size: 11px;
      text-align: right;
    }
  </style>
</head>
<body>
  <header class="header">
    <h1>${escapeHtml(title)}</h1>
    <div class="muted">Briefing ID: ${escapeHtml(input.id)}</div>
    <div class="meta">
      <div><strong>Date:</strong> ${escapeHtml(eventDate)}</div>
      <div><strong>Location:</strong> ${escapeHtml(location)}</div>
    </div>
  </header>
  <main class="canvas">
    ${moduleSections}
  </main>

  <footer class="footer">Generated at ${escapeHtml(new Date().toISOString())}</footer>
</body>
</html>
  `.trim();
}

export type { BriefingHtmlInput };
