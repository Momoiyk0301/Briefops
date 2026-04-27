import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";

import { AppErrorArea, AppErrorCode, AppErrorSeverity, inferErrorCode } from "@/lib/errorCodes";
import { logEvent } from "@/lib/logger";

export class HttpError extends Error {
  status: number;
  code: AppErrorCode;

  constructor(status: number, message: string, code?: AppErrorCode) {
    super(message);
    this.status = status;
    this.code = code ?? inferHttpErrorCode(status, message);
  }
}

type ErrorResponseOptions = {
  area?: AppErrorArea;
  action?: string;
  errorCode?: AppErrorCode;
  severity?: AppErrorSeverity;
  route?: string;
  locale?: string;
  [key: string]: unknown;
};

function inferHttpErrorCode(status: number, message: string): AppErrorCode {
  if (status === 401 || status === 403) return "SUPABASE_RLS_DENIED";
  if (status === 404) return "SUPABASE_NOT_FOUND";
  if (/storage|bucket|upload/i.test(message)) return "SUPABASE_STORAGE_UPLOAD_FAILED";
  return "UNKNOWN_ERROR";
}

export function createRequestContext(route: string, _request?: Request) {
  const requestId = randomUUID();

  const log = (level: "info" | "warn" | "error", message: string, extra?: Record<string, unknown>) => {
    logEvent(level, `[api] ${message}`, {
      requestId,
      route,
      ...extra
    });
  };

  return {
    requestId,
    info: (message: string, extra?: Record<string, unknown>) => log("info", message, extra),
    warn: (message: string, extra?: Record<string, unknown>) => log("warn", message, extra),
    error: (message: string, extra?: Record<string, unknown>) => log("error", message, extra),
    captureException: (message: string, error: unknown, extra?: ErrorResponseOptions) => {
      const details = describeError(error);
      const errorCode = extra?.errorCode ?? inferErrorCode(error);
      const severity = extra?.severity ?? "medium";
      log("error", message, { ...extra, ...details });
      const normalized = error instanceof Error ? error : new Error(details.message ? String(details.message) : "Unknown error");
      Sentry.captureException(normalized, {
        tags: {
          area: extra?.area ?? "api",
          action: extra?.action,
          errorCode,
          severity,
          route,
          locale: extra?.locale
        },
        extra: { requestId, ...extra, errorCode, severity, ...details }
      });
    }
  };
}

export function describeError(error: unknown): Record<string, unknown> {
  if (error instanceof z.ZodError) {
    return {
      type: "ZodError",
      message: error.message,
      issues: error.issues,
      details: error.flatten()
    };
  }

  if (error instanceof Error) {
    const extra = error as Error & {
      status?: number;
      code?: string;
      details?: unknown;
      hint?: string;
      cause?: unknown;
    };

    return {
      type: error.name || "Error",
      message: error.message,
      status: extra.status,
      code: extra.code,
      details: extra.details,
      hint: extra.hint,
      cause:
        extra.cause instanceof Error
          ? { type: extra.cause.name, message: extra.cause.message }
          : extra.cause,
      stack: error.stack
    };
  }

  if (typeof error === "object" && error !== null) {
    return {
      type: "Object",
      ...sanitizeUnknownErrorObject(error)
    };
  }

  return {
    type: typeof error,
    message: String(error)
  };
}

function sanitizeUnknownErrorObject(error: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(error).map(([key, value]) => {
      if (value instanceof Error) {
        return [key, { type: value.name, message: value.message, stack: value.stack }];
      }
      return [key, value];
    })
  );
}

export function toErrorResponse(error: unknown, requestId: string, options: ErrorResponseOptions = {}) {
  let status = 500;
  let details: unknown = undefined;
  let errorCode: AppErrorCode = options.errorCode ?? inferErrorCode(error);

  if (error instanceof HttpError) {
    status = error.status;
    errorCode = options.errorCode ?? error.code;
  } else if (error instanceof z.ZodError) {
    status = 400;
    errorCode = options.errorCode ?? "UNKNOWN_ERROR";
    details = error.flatten();
  } else if (error instanceof Error && error.message === "Unauthorized") {
    status = 401;
    errorCode = options.errorCode ?? "SUPABASE_RLS_DENIED";
  }

  logEvent("error", "[api] response error", {
    requestId,
    status,
    errorCode,
    ...options,
    ...describeError(error)
  });

  const shouldCapture = status >= 500 || options.severity === "critical" || options.severity === "high";
  if (status >= 500) {
    const normalized = error instanceof Error ? error : new Error(errorCode);
    Sentry.captureException(normalized, {
      tags: {
        area: options.area ?? "api",
        action: options.action,
        errorCode,
        severity: options.severity ?? (shouldCapture ? "high" : "medium"),
        route: options.route,
        status: String(status),
        locale: options.locale
      },
      extra: { requestId, ...options, errorCode, ...describeError(error) }
    });
  }

  const body: Record<string, unknown> = { error: errorCode, request_id: requestId };
  if (details !== undefined) {
    body.details = details;
  }

  return NextResponse.json(body, { status });
}
