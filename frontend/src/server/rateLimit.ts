type Entry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Entry>();

export function resolveRateLimitKey(request: Request, scope: string, identity: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "ip:unknown";
  return `${scope}:${identity}:${forwardedFor}`;
}

export function enforceRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true as const, remaining: Math.max(max - 1, 0), resetAt: now + windowMs };
  }

  if (current.count >= max) {
    return { allowed: false as const, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  store.set(key, current);
  return { allowed: true as const, remaining: Math.max(max - current.count, 0), resetAt: current.resetAt };
}

export function resetRateLimitStore() {
  store.clear();
}
