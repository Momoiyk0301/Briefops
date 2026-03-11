import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function createRequestContext(route: string) {
  const requestId = randomUUID();

  const sanitize = (value: unknown): unknown => {
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
  };

  const log = (level: "info" | "warn" | "error", message: string, extra?: Record<string, unknown>) => {
    const payload = {
      requestId,
      route,
      ...sanitize(extra)
    };

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

  return {
    requestId,
    info: (message: string, extra?: Record<string, unknown>) => log("info", message, extra),
    warn: (message: string, extra?: Record<string, unknown>) => log("warn", message, extra),
    error: (message: string, extra?: Record<string, unknown>) => log("error", message, extra)
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
