import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";

import { logEvent } from "@/lib/logger";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
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
    captureException: (message: string, error: unknown, extra?: Record<string, unknown>) => {
      const details = describeError(error);
      log("error", message, { ...extra, ...details });
      const normalized = error instanceof Error ? error : new Error(details.message ? String(details.message) : "Unknown error");
      Sentry.captureException(normalized, {
        tags: { area: "api", route },
        extra: { requestId, ...extra, ...details }
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

export function toErrorResponse(error: unknown, requestId: string) {
  let status = 500;
  let message = "Internal server error";
  let details: unknown = undefined;

  if (error instanceof HttpError) {
    status = error.status;
    message = error.message;
  } else if (error instanceof z.ZodError) {
    status = 400;
    message = "Validation failed";
    details = error.flatten();
  } else if (error instanceof Error && error.message === "Unauthorized") {
    status = 401;
    message = "Unauthorized";
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "object" && error !== null && "message" in error) {
    message = String((error as { message?: unknown }).message ?? "Internal server error");
  }

  logEvent("error", "[api] response error", {
    requestId,
    status,
    ...describeError(error)
  });

  if (status >= 500) {
    const normalized = error instanceof Error ? error : new Error(message);
    Sentry.captureException(normalized, {
      tags: { area: "api", status: String(status) },
      extra: { requestId, ...describeError(error) }
    });
  }

  const body: Record<string, unknown> = { error: message, request_id: requestId };
  if (details !== undefined) {
    body.details = details;
  }

  return NextResponse.json(body, { status });
}
