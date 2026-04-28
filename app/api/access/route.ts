import { NextResponse } from "next/server";

const SITE_ACCESS_COOKIE = "site_access";
const SITE_ACCESS_COOKIE_VALUE = "granted";
const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  const expectedPassword = process.env.ACCESS_PASSWORD;

  if (!expectedPassword || password !== expectedPassword) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SITE_ACCESS_COOKIE, SITE_ACCESS_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE
  });

  return response;
}
