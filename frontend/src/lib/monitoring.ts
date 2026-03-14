import * as Sentry from "@sentry/nextjs";

function sanitizeContext(context?: Record<string, unknown>) {
  if (!context) return undefined;
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => {
      if (/token|authorization|signature|secret|password|email|api[-_]?key/i.test(key)) {
        return [key, "[redacted]"];
      }
      return [key, value];
    })
  );
}

export function captureClientError(error: unknown, context?: Record<string, unknown>) {
  const normalized = error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unexpected client error");
  Sentry.captureException(normalized, {
    tags: { area: "frontend" },
    extra: sanitizeContext(context)
  });
}
