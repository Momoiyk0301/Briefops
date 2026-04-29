const APP_PATH_PREFIXES = [
  "/login",
  "/auth",
  "/onboarding",
  "/briefings",
  "/documents",
  "/modules",
  "/staff",
  "/account",
  "/abonnement",
  "/notifications",
  "/settings",
  "/help",
  "/status"
] as const;

function normalizePathname(pathname: string) {
  return pathname === "" ? "/" : pathname;
}

export function isBypassPath(pathname: string) {
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname === "/favicon.ico" ||
    pathname === "/logo.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

export function isAppPath(pathname: string) {
  return APP_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isLocalizedMarketingPath(pathname: string) {
  return (
    pathname === "/fr" ||
    pathname.startsWith("/fr/") ||
    pathname === "/nl" ||
    pathname.startsWith("/nl/") ||
    pathname === "/en" ||
    pathname.startsWith("/en/")
  );
}
