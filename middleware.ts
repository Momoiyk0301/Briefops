import { NextRequest, NextResponse } from "next/server";

import { logEvent } from "@/lib/logger";
import { resolveSiteRouting } from "@/lib/siteRouting";

const SITE_ACCESS_COOKIE = "site_access";
const SITE_ACCESS_COOKIE_VALUE = "granted";

function isAccessBypassPath(pathname: string) {
  return (
    pathname === "/access" ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname === "/favicon.ico" ||
    pathname === "/logo.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!isAccessBypassPath(pathname)) {
    const hasAccess = request.cookies.get(SITE_ACCESS_COOKIE)?.value === SITE_ACCESS_COOKIE_VALUE;

    if (!hasAccess) {
      return NextResponse.redirect(new URL("/access", request.url));
    }
  }

  const decision = resolveSiteRouting({
    host: request.headers.get("host"),
    pathname,
    search: request.nextUrl.search,
    acceptLanguage: request.headers.get("accept-language")
  });

  if (decision.action === "redirect") {
    logEvent("info", "[middleware] redirect", {
      reason: decision.reason,
      pathname: request.nextUrl.pathname,
      host: request.headers.get("host"),
      locale: decision.locale
    });

    return NextResponse.redirect(new URL(decision.destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.ico|robots.txt|sitemap.xml).*)"]
};
