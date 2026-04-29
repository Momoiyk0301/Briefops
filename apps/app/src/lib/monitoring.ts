import * as Sentry from "@sentry/nextjs";

import { AppErrorArea, AppErrorCode, AppErrorContext, AppErrorSeverity, inferErrorCode } from "@/lib/errorCodes";
import { sanitizeLogContext } from "@/lib/logger";

function normalizeError(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error : new Error(typeof error === "string" ? error : fallbackMessage);
}

function captureAppException(
  error: unknown,
  context: AppErrorContext & {
    area: AppErrorArea;
    errorCode?: AppErrorCode;
    severity?: AppErrorSeverity;
  }
) {
  const normalized = normalizeError(error, "Unexpected application error");
  const errorCode = context.errorCode ?? inferErrorCode(error);
  const severity = context.severity ?? "medium";
  const safeContext = sanitizeLogContext({ ...context, errorCode, severity });

  Sentry.captureException(normalized, {
    tags: {
      area: context.area,
      action: context.action,
      errorCode,
      severity,
      route: context.route,
      locale: context.locale
    },
    extra: safeContext
  });
}

export function captureAppError(error: unknown, context: AppErrorContext = {}) {
  captureAppException(error, { ...context, area: context.area ?? "react" });
}

export function captureApiError(error: unknown, context: AppErrorContext = {}) {
  captureAppException(error, { ...context, area: "api" });
}

export function captureAuthError(error: unknown, context: AppErrorContext = {}) {
  captureAppException(error, { ...context, area: "auth" });
}

export function captureSupabaseError(error: unknown, context: AppErrorContext = {}) {
  captureAppException(error, { ...context, area: "supabase", errorCode: context.errorCode ?? inferErrorCode(error) });
}

export function captureStripeError(error: unknown, context: AppErrorContext = {}) {
  captureAppException(error, { ...context, area: "stripe" });
}

export function capturePdfError(error: unknown, context: AppErrorContext = {}) {
  captureAppException(error, { ...context, area: "pdf", severity: context.severity ?? "high" });
}

export function captureEmailError(error: unknown, context: AppErrorContext = {}) {
  captureAppException(error, { ...context, area: "email" });
}

export function captureClientError(error: unknown, context?: AppErrorContext) {
  const normalized = error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unexpected client error");
  const area = typeof context?.area === "string" ? context.area : "react";
  const errorCode = context?.errorCode ?? inferErrorCode(error);
  Sentry.captureException(normalized, {
    tags: {
      area,
      action: context?.action,
      errorCode,
      severity: context?.severity ?? "medium",
      route: context?.route,
      locale: context?.locale
    },
    extra: sanitizeLogContext({ ...context, errorCode })
  });
}
