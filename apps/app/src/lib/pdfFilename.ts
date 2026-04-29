type BuildPdfFilenameParams = {
  title?: string | null;
  eventDate?: string | null;
  team?: string | null;
  version?: number | null;
};

function slugifySegment(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDateSegment(value?: string | null) {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.replace(/[^0-9]/g, "").slice(0, 8) || null;
}

export function buildBriefingPdfFilename(params: BuildPdfFilenameParams) {
  const parts = [slugifySegment(params.title || "briefing") || "briefing"];
  const dateSegment = normalizeDateSegment(params.eventDate);
  const teamSegment = params.team ? slugifySegment(params.team) : "";

  if (dateSegment) parts.push(dateSegment);
  if (teamSegment) parts.push(teamSegment);
  if (typeof params.version === "number" && Number.isFinite(params.version)) parts.push(`v${params.version}`);

  return `${parts.join("-")}.pdf`;
}

