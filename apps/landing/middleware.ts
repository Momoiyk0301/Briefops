import { NextRequest, NextResponse } from "next/server";

import { resolveLandingRouting } from "@/lib/siteRouting";

function isBypassPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname === "/favicon.ico" ||
    pathname === "/logo.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes(".")
  );
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isBypassPath(pathname)) {
    return NextResponse.next();
  }

  const decision = resolveLandingRouting({
    pathname,
    search: request.nextUrl.search,
    acceptLanguage: request.headers.get("accept-language")
  });

  if (decision.action === "redirect") {
    return NextResponse.redirect(new URL(decision.destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.ico|robots.txt|sitemap.xml).*)"]
};
