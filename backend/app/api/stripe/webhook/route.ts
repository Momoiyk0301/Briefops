import { NextResponse } from "next/server";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { handleStripeWebhookEvent } from "@/stripe/webhook";
import { getStripe, getStripeWebhookSecret } from "@/stripe/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ctx = createRequestContext("POST /api/stripe/webhook");

  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      throw new HttpError(400, "Missing stripe-signature header");
    }

    const payload = await request.text();
    const event = getStripe().webhooks.constructEvent(payload, signature, getStripeWebhookSecret());

    await handleStripeWebhookEvent(event);
    ctx.info("processed webhook", { eventType: event.type, eventId: event.id });

    return NextResponse.json({ received: true });
  } catch (error) {
    ctx.error("failed", { error: error instanceof Error ? error.message : String(error) });
    return toErrorResponse(error, ctx.requestId);
  }
}
