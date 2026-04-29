const CONFIGURED_API_URL = String(process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "");

function isLocalAlias(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function shouldUseSameOrigin(configuredApiUrl: string) {
  if (!configuredApiUrl) return true;
  if (typeof window === "undefined") return false;

  try {
    const configuredUrl = new URL(configuredApiUrl);
    const currentUrl = new URL(window.location.origin);

    if (configuredUrl.origin === currentUrl.origin) return true;

    return (
      isLocalAlias(configuredUrl.hostname) &&
      isLocalAlias(currentUrl.hostname) &&
      configuredUrl.port === currentUrl.port &&
      configuredUrl.protocol === currentUrl.protocol
    );
  } catch {
    return false;
  }
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (shouldUseSameOrigin(CONFIGURED_API_URL)) return normalizedPath;
  return `${CONFIGURED_API_URL}${normalizedPath}`;
}
