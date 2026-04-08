import * as Sentry from "@sentry/nextjs";

import { sanitizeLogContext } from "@/lib/logger";

export function captureClientError(error: unknown, context?: Record<string, unknown>) {
  const normalized = error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unexpected client error");
  const area = typeof context?.area === "string" ? context.area : "frontend";
  Sentry.captureException(normalized, {
    tags: { area },
    extra: sanitizeLogContext(context)
  });
}
