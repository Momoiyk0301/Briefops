import { NextRequest, NextResponse } from "next/server";

import { logEvent } from "@/lib/logger";
import { isAppPath, resolveSiteRouting } from "@/lib/siteRouting";
import { isAppHost, isLocalHost, isMarketingHost, isPreviewHost, normalizeHost } from "@/lib/sites";

const SITE_ACCESS_COOKIE = "site_access";
const SITE_ACCESS_COOKIE_VALUE = "granted";

function hasSiteAccess(request: NextRequest) {
  return request.cookies.get(SITE_ACCESS_COOKIE)?.value === SITE_ACCESS_COOKIE_VALUE;
}

function isAccessBypassPath(pathname: string) {
  return (
    pathname === "/access" ||
    pathname.startsWith("/access/") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname.includes(".")
  );
}

function shouldProtectAppAccess(request: NextRequest, pathname: string) {
  if (isAccessBypassPath(pathname)) {
    return false;
  }

  const host = normalizeHost(request.headers.get("host"));

  if (isMarketingHost(host)) {
    return false;
  }

  if (isAppHost(host)) {
    return true;
  }

  if (isLocalHost(host) || isPreviewHost(host) || !host) {
    return isAppPath(pathname);
  }

  return isAppPath(pathname);
}

function isSameRequestUrl(destination: string, request: NextRequest) {
  const destinationUrl = new URL(destination, request.url);
  return (
    normalizeHost(destinationUrl.host) === normalizeHost(request.headers.get("host")) &&
    destinationUrl.pathname === request.nextUrl.pathname &&
    destinationUrl.search === request.nextUrl.search
  );
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = normalizeHost(request.headers.get("host"));

  if (isAccessBypassPath(pathname)) {
    return NextResponse.next();
  }

  if (isAppHost(host) && pathname === "/" && !hasSiteAccess(request)) {
    return NextResponse.redirect(new URL("/access", request.url));
  }

  const decision = resolveSiteRouting({
    host: request.headers.get("host"),
    pathname,
    search: request.nextUrl.search,
    acceptLanguage: request.headers.get("accept-language")
  });

  if (decision.action === "redirect") {
    if (isSameRequestUrl(decision.destination, request)) {
      logEvent("warn", "[middleware] skipped self redirect", {
        reason: decision.reason,
        pathname: request.nextUrl.pathname,
        host: request.headers.get("host"),
        destination: decision.destination
      });

      return NextResponse.next();
    }

    logEvent("info", "[middleware] redirect", {
      reason: decision.reason,
      pathname: request.nextUrl.pathname,
      host: request.headers.get("host"),
      locale: decision.locale
    });

    return NextResponse.redirect(new URL(decision.destination, request.url));
  }

  if (shouldProtectAppAccess(request, pathname)) {
    if (!hasSiteAccess(request)) {
      return NextResponse.redirect(new URL("/access", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.ico|robots.txt|sitemap.xml).*)"]
};
