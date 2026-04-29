type LogLevel = "info" | "warn" | "error";

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
      if (/token|authorization|signature|secret|password|email|stripe|api[-_]?key/i.test(key)) {
        return [key, "[redacted]"];
      }

      return [key, sanitizeValue(entry)];
    })
  );
}

export function sanitizeLogContext(context?: Record<string, unknown>) {
  if (!context) return {};
  return sanitizeValue(context) as Record<string, unknown>;
}

export function logEvent(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const payload = sanitizeLogContext(context);

  if (level === "info") {
    console.info(message, payload);
    return;
  }

  if (level === "warn") {
    console.warn(message, payload);
    return;
  }

  console.error(message, payload);
}

