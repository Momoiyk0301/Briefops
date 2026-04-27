export const ERROR_CODES = [
  "AUTH_LOGIN_FAILED",
  "AUTH_SIGNUP_FAILED",
  "AUTH_EMAIL_NOT_CONFIRMED",
  "AUTH_RESET_PASSWORD_FAILED",
  "BRIEFING_CREATE_FAILED",
  "BRIEFING_UPDATE_FAILED",
  "BRIEFING_DELETE_FAILED",
  "BRIEFING_LOAD_FAILED",
  "BRIEFING_MODULE_SAVE_FAILED",
  "SUPABASE_QUERY_FAILED",
  "SUPABASE_RLS_DENIED",
  "SUPABASE_NOT_FOUND",
  "SUPABASE_STORAGE_UPLOAD_FAILED",
  "STRIPE_CHECKOUT_FAILED",
  "STRIPE_PORTAL_FAILED",
  "STRIPE_WEBHOOK_SIGNATURE_FAILED",
  "STRIPE_WEBHOOK_FAILED",
  "STRIPE_SUBSCRIPTION_SYNC_FAILED",
  "PDF_EXPORT_FAILED",
  "PDF_RENDER_FAILED",
  "PDF_BROWSER_FAILED",
  "PDF_STORAGE_UPLOAD_FAILED",
  "PDF_EXPORT_DB_FAILED",
  "PDF_EXPORT_TIMEOUT",
  "EMAIL_SEND_FAILED",
  "SUPPORT_REQUEST_FAILED",
  "PUBLIC_SHARE_LOAD_FAILED",
  "PUBLIC_LINK_CREATE_FAILED",
  "UNKNOWN_ERROR"
] as const;

export type AppErrorCode = (typeof ERROR_CODES)[number];

export type AppErrorArea =
  | "auth"
  | "api"
  | "stripe"
  | "supabase"
  | "pdf"
  | "storage"
  | "email"
  | "react"
  | "support"
  | "public_share";

export type AppErrorSeverity = "low" | "medium" | "high" | "critical";

export type AppErrorContext = {
  area?: AppErrorArea;
  action?: string;
  errorCode?: AppErrorCode;
  severity?: AppErrorSeverity;
  route?: string;
  locale?: string;
  workspaceId?: string | null;
  userId?: string | null;
  briefingId?: string | null;
  exportId?: string | null;
  stripeEventType?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  supabaseTable?: string | null;
  supportRequestId?: string | null;
  step?: string | null;
  [key: string]: unknown;
};

export function isAppErrorCode(value: unknown): value is AppErrorCode {
  return typeof value === "string" && ERROR_CODES.includes(value as AppErrorCode);
}

export function resolveErrorCode(value: unknown, fallback: AppErrorCode = "UNKNOWN_ERROR"): AppErrorCode {
  if (isAppErrorCode(value)) return value;
  return fallback;
}

export function inferErrorCode(error: unknown): AppErrorCode {
  if (typeof error === "object" && error !== null && "code" in error && isAppErrorCode((error as { code?: unknown }).code)) {
    return (error as { code: AppErrorCode }).code;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "");
    if (/unauthorized|forbidden|row-level security|rls|permission denied/i.test(message)) return "SUPABASE_RLS_DENIED";
    if (/not found|no rows|missing/i.test(message)) return "SUPABASE_NOT_FOUND";
    if (/storage|bucket|upload/i.test(message)) return "SUPABASE_STORAGE_UPLOAD_FAILED";
  }

  return "UNKNOWN_ERROR";
}
