import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { enforceRateLimit, resolveRateLimitKey } from "@/server/rateLimit";
import { createServiceRoleClient } from "@/supabase/server";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase())
});

async function findUserByEmail(email: string) {
  const admin = createServiceRoleClient();
  let page = 1;

  while (page <= 5) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;

    const matched = data.users.find((user) => (user.email ?? "").toLowerCase() === email);
    if (matched) return matched;
    if (!data.nextPage) return null;
    page = data.nextPage;
  }

  return null;
}

export async function POST(request: Request) {
  const ctx = createRequestContext("POST /api/auth/login-hint", request);

  try {
    const rateLimit = enforceRateLimit(resolveRateLimitKey(request, "login-hint", "anonymous"), 10, 60_000);
    if (!rateLimit.allowed) {
      throw new HttpError(429, "Too many login attempts. Please wait a minute.");
    }

    const { email } = bodySchema.parse(await request.json());
    const user = await findUserByEmail(email);

    ctx.info("resolved login hint", {
      step: "lookup",
      exists: Boolean(user),
      emailConfirmed: Boolean(user?.email_confirmed_at)
    });

    return NextResponse.json({
      exists: Boolean(user),
      email_confirmed: Boolean(user?.email_confirmed_at)
    });
  } catch (error) {
    ctx.captureException("failed to resolve login hint", error, {
      step: "login-hint"
    });
    return toErrorResponse(error, ctx.requestId);
  }
}
