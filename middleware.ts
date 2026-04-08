import { NextRequest, NextResponse } from "next/server";

import { logEvent } from "@/lib/logger";
import { resolveSiteRouting } from "@/lib/siteRouting";

export function middleware(request: NextRequest) {
  const decision = resolveSiteRouting({
    host: request.headers.get("host"),
    pathname: request.nextUrl.pathname,
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
