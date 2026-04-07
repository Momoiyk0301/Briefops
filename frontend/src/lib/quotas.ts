const LIMITS = {
  starter:    { briefings: 5,        pdf_month: 10,       storage: 20 * 1024 * 1024,       watermark: true  },
  pro:        { briefings: Infinity, pdf_month: Infinity, storage: 1 * 1024 * 1024 * 1024, watermark: false },
  guest:      { briefings: Infinity, pdf_month: Infinity, storage: 1 * 1024 * 1024 * 1024, watermark: false },
  funder:     { briefings: Infinity, pdf_month: Infinity, storage: 1 * 1024 * 1024 * 1024, watermark: false },
  enterprise: { briefings: Infinity, pdf_month: Infinity, storage: Infinity,               watermark: false },
} as const;

export type PlanKey = keyof typeof LIMITS;
export type QuotaAction = "create_briefing" | "upload" | "export_pdf";

export type WorkspaceQuotaState = {
  id?: string;
  plan?: string | null;
  storage_used_bytes?: number | null;
  briefings_count?: number | null;
  pdf_exports_month?: number | null;
  pdf_exports_reset_at?: string | null;
};

function addOneMonth(value: Date) {
  const next = new Date(value);
  next.setMonth(next.getMonth() + 1);
  return next;
}

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export function normalizePlan(plan: string | null | undefined): PlanKey {
  const value = String(plan ?? "").trim().toLowerCase();
  if (value === "guest") return "guest";
  if (value === "funder") return "funder";
  if (value === "enterprise") return "enterprise";
  if (value === "pro") return "pro";
  return "starter";
}

export function getPlanLimits(plan: string | null | undefined) {
  return LIMITS[normalizePlan(plan)];
}

export function resetPdfQuotaIfNeeded<T extends WorkspaceQuotaState>(org: T): T & {
  pdf_exports_month: number;
  pdf_exports_reset_at: string;
} {
  const resetAt = org.pdf_exports_reset_at ? new Date(org.pdf_exports_reset_at) : startOfToday();
  const today = startOfToday();
  if (resetAt.getTime() >= today.getTime()) {
    return {
      ...org,
      pdf_exports_month: Number(org.pdf_exports_month ?? 0),
      pdf_exports_reset_at: resetAt.toISOString()
    };
  }

  return {
    ...org,
    pdf_exports_month: 0,
    pdf_exports_reset_at: addOneMonth(today).toISOString()
  };
}

function getActionUsage(org: WorkspaceQuotaState, action: QuotaAction, value = 0) {
  if (action === "create_briefing") {
    return Number(org.briefings_count ?? 0) + 1;
  }
  if (action === "upload") {
    return Number(org.storage_used_bytes ?? 0) + Math.max(Number(value ?? 0), 0);
  }
  return Number(org.pdf_exports_month ?? 0) + 1;
}

function getActionLimit(plan: string | null | undefined, action: QuotaAction) {
  const limits = getPlanLimits(plan);
  if (action === "create_briefing") return limits.briefings;
  if (action === "upload") return limits.storage;
  return limits.pdf_month;
}

function getActionLabel(action: QuotaAction) {
  if (action === "create_briefing") return "briefings";
  if (action === "upload") return "storage";
  return "PDF exports";
}

export function checkQuota(org: WorkspaceQuotaState, action: QuotaAction, value = 0) {
  const normalized = resetPdfQuotaIfNeeded(org);
  const limit = getActionLimit(normalized.plan, action);
  const nextUsage = getActionUsage(normalized, action, value);
  const allowed = !Number.isFinite(limit) || nextUsage <= limit;

  return {
    allowed,
    limit,
    current: action === "create_briefing"
      ? Number(normalized.briefings_count ?? 0)
      : action === "upload"
        ? Number(normalized.storage_used_bytes ?? 0)
        : Number(normalized.pdf_exports_month ?? 0),
    nextUsage,
    message: allowed ? null : `You have reached the ${getActionLabel(action)} limit for the ${normalizePlan(normalized.plan)} plan.`,
    org: normalized
  };
}

export function getRemainingQuota(org: WorkspaceQuotaState) {
  const normalized = resetPdfQuotaIfNeeded(org);
  const limits = getPlanLimits(normalized.plan);

  return {
    briefings: Number.isFinite(limits.briefings) ? Math.max(limits.briefings - Number(normalized.briefings_count ?? 0), 0) : null,
    pdf_month: Number.isFinite(limits.pdf_month) ? Math.max(limits.pdf_month - Number(normalized.pdf_exports_month ?? 0), 0) : null,
    storage: Number.isFinite(limits.storage) ? Math.max(limits.storage - Number(normalized.storage_used_bytes ?? 0), 0) : null,
    watermark: limits.watermark,
    plan: normalizePlan(normalized.plan)
  };
}

export { LIMITS };
