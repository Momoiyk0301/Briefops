import { randomUUID } from "node:crypto";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type RequestContextExtra = Record<string, unknown>;

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
      if (/token|authorization|signature|secret|password|email|stripe|api[-_]?key/i.test(key)) {
        return [key, "[redacted]"];
      }
      return [key, sanitize(entry)];
    })
  );
}

function sanitizeObject(value?: RequestContextExtra): RequestContextExtra {
  if (!value) return {};
  return sanitize(value) as RequestContextExtra;
}

export function createRequestContext(route: string, request?: Request, baseExtra?: RequestContextExtra) {
  const requestId = randomUUID();
  const requestDetails = request
    ? {
        method: request.method,
        url: (() => {
          try {
            return new URL(request.url).pathname;
          } catch {
            return request.url;
          }
        })()
      }
    : {};

  const buildPayload = (extra?: RequestContextExtra) => {
    return {
      requestId,
      route,
      ...requestDetails,
      ...sanitizeObject(baseExtra),
      ...sanitizeObject(extra)
    };
  };

  const log = (level: "info" | "warn" | "error", message: string, extra?: RequestContextExtra) => {
    const payload = buildPayload(extra);
    if (level === "info") {
      console.info(`[api] ${message}`, payload);
      return;
    }

    if (level === "warn") {
      console.warn(`[api] ${message}`, payload);
      return;
    }

    console.error(`[api] ${message}`, payload);
  };

  const captureException = (message: string, error: unknown, extra?: RequestContextExtra) => {
    const payload = buildPayload(extra);
    Sentry.withScope((scope) => {
      scope.setTag("request_id", requestId);
      scope.setTag("route", route);
      if (typeof payload.method === "string") {
        scope.setTag("method", payload.method);
      }
      if ("userId" in payload && typeof payload.userId === "string") {
        scope.setUser({ id: payload.userId });
      }
      scope.setContext("request", payload);
      scope.setExtras(payload);
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
    });
    log("error", message, {
      ...payload,
      error: error instanceof Error ? error.message : String(error)
    });
  };

  return {
    requestId,
    info: (message: string, extra?: Record<string, unknown>) => log("info", message, extra),
    warn: (message: string, extra?: Record<string, unknown>) => log("warn", message, extra),
    error: (message: string, extra?: Record<string, unknown>) => log("error", message, extra),
    captureException
  };
}

export function toErrorResponse(error: unknown, requestId: string) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message, request_id: requestId }, { status: error.status });
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: error.flatten(),
        request_id: requestId
      },
      { status: 400 }
    );
  }

  if (error instanceof Error && error.message === "Unauthorized") {
    return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message ?? "Internal server error")
        : "Internal server error";
  return NextResponse.json({ error: message, request_id: requestId }, { status: 500 });
}
