import { NextRequest, NextResponse } from "next/server";

import { logEvent } from "@/lib/logger";
import { isAppPath, isLocalizedMarketingPath } from "@/lib/siteRouting";
import { buildAppUrl, buildMarketingUrl } from "@shared/sites";

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

  if (process.env.NEXT_PUBLIC_E2E_MOCK_AUTH === "true") {
    return false;
  }

  if (pathname === "/") {
    return true;
  }

  return isAppPath(pathname);
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isAccessBypassPath(pathname)) {
    return NextResponse.next();
  }

  if (isLocalizedMarketingPath(pathname)) {
    const destination = buildMarketingUrl(`${pathname}${request.nextUrl.search}`);
    logEvent("info", "[middleware] redirect", {
      reason: "app-to-marketing",
      pathname,
      host: request.headers.get("host")
    });
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (pathname === "/" && hasSiteAccess(request)) {
    const destination = buildAppUrl("/login");
    logEvent("info", "[middleware] redirect", {
      reason: "app-root-login",
      pathname,
      host: request.headers.get("host")
    });
    return NextResponse.redirect(new URL(destination, request.url));
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
