import { detectMarketingLocale, isMarketingLocale, type MarketingLocale } from "@/i18n/marketing";
import {
  buildAppUrl,
  buildMarketingUrl,
  isAppHost,
  isLocalHost,
  isMarketingHost,
  isPreviewHost,
  normalizeHost
} from "@/lib/sites";

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
  return pathname === "/fr" || pathname.startsWith("/fr/") || pathname === "/nl" || pathname.startsWith("/nl/");
}

export type SiteRoutingDecision =
  | { action: "next" }
  | { action: "redirect"; destination: string; reason: string; locale?: MarketingLocale };

type RoutingInput = {
  host: string | null | undefined;
  pathname: string;
  search?: string;
  acceptLanguage?: string | null | undefined;
};

export function resolveSiteRouting({
  host,
  pathname,
  search = "",
  acceptLanguage
}: RoutingInput): SiteRoutingDecision {
  const normalizedHost = normalizeHost(host);
  const normalizedPathname = normalizePathname(pathname);
  const locale = detectMarketingLocale(acceptLanguage);
  const fullPath = `${normalizedPathname}${search}`;

  if (isBypassPath(normalizedPathname)) {
    return { action: "next" };
  }

  if (isMarketingHost(normalizedHost)) {
    if (normalizedPathname === "/") {
      return {
        action: "redirect",
        destination: buildMarketingUrl(`/${locale}`),
        reason: "marketing-root-locale",
        locale
      };
    }

    if (isAppPath(normalizedPathname)) {
      return {
        action: "redirect",
        destination: buildAppUrl(fullPath),
        reason: "marketing-to-app"
      };
    }

    if (!isLocalizedMarketingPath(normalizedPathname)) {
      return {
        action: "redirect",
        destination: buildMarketingUrl(`/${locale}`),
        reason: "marketing-normalize-locale",
        locale
      };
    }

    return { action: "next" };
  }

  if (isAppHost(normalizedHost)) {
    if (isLocalizedMarketingPath(normalizedPathname)) {
      return {
        action: "redirect",
        destination: buildMarketingUrl(fullPath),
        reason: "app-to-marketing"
      };
    }

    return { action: "next" };
  }

  if (isLocalHost(normalizedHost) || isPreviewHost(normalizedHost) || !normalizedHost) {
    if (normalizedPathname === "/") {
      return {
        action: "redirect",
        destination: `/${locale}`,
        reason: "local-root-locale",
        locale
      };
    }

    if (normalizedPathname.split("/").length > 1) {
      const firstSegment = normalizedPathname.split("/")[1] ?? "";
      if (firstSegment && !isMarketingLocale(firstSegment) && !isAppPath(normalizedPathname)) {
        return { action: "next" };
      }
    }

    return { action: "next" };
  }

  return { action: "next" };
}

