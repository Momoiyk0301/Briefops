import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000"
]);

function buildCorsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const isLocalVite = /^https?:\/\/(localhost|127\.0\.0\.1):\d{2,5}$/.test(origin);
  const allowOrigin = ALLOWED_ORIGINS.has(origin) || isLocalVite ? origin : "http://localhost:5173";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, stripe-signature, x-module-key",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin"
  };
}

export function middleware(request: NextRequest) {
  const headers = buildCorsHeaders(request);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers
    });
  }

  const response = NextResponse.next();
  Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: "/api/:path*"
};
