import { buildAppUrl } from "@shared/sites";

import { detectMarketingLocale, isMarketingLocale, type MarketingLocale } from "@/i18n/marketing";

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

export type LandingRoutingDecision =
  | { action: "next" }
  | { action: "redirect"; destination: string; reason: string; locale?: MarketingLocale };

type RoutingInput = {
  pathname: string;
  search?: string;
  acceptLanguage?: string | null | undefined;
};

export function resolveLandingRouting({
  pathname,
  search = "",
  acceptLanguage
}: RoutingInput): LandingRoutingDecision {
  const normalizedPathname = normalizePathname(pathname);
  const locale = detectMarketingLocale(acceptLanguage);
  const fullPath = `${normalizedPathname}${search}`;

  if (normalizedPathname === "/" || isLocalizedMarketingPath(normalizedPathname)) {
    return { action: "next" };
  }

  if (isAppPath(normalizedPathname)) {
    return {
      action: "redirect",
      destination: buildAppUrl(fullPath),
      reason: "landing-to-app"
    };
  }

  const firstSegment = normalizedPathname.split("/")[1] ?? "";
  if (firstSegment && !isMarketingLocale(firstSegment)) {
    return {
      action: "redirect",
      destination: `/${locale}`,
      reason: "landing-normalize-locale",
      locale
    };
  }

  return { action: "next" };
}
