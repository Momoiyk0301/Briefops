import { NextResponse } from "next/server";

import { createRequestContext, HttpError, toErrorResponse } from "@/http";
import { handleStripeWebhookEvent } from "@/stripe/webhook";
import { getStripe, getStripeWebhookSecret } from "@/stripe/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ctx = createRequestContext("POST /api/stripe/webhook", request);

  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      throw new HttpError(400, "Missing stripe-signature header", "STRIPE_WEBHOOK_SIGNATURE_FAILED");
    }

    const payload = await request.text();
    const event = getStripe().webhooks.constructEvent(payload, signature, getStripeWebhookSecret());

    await handleStripeWebhookEvent(event);
    ctx.info("processed webhook", { eventType: event.type, eventId: event.id });

    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof Error && /invalid signature/i.test(error.message)) {
      const normalized = new HttpError(400, "Invalid signature", "STRIPE_WEBHOOK_SIGNATURE_FAILED");
      ctx.captureException("stripe webhook signature invalid", normalized, {
        origin: "server",
        step: "verify-signature",
        area: "stripe",
        action: "webhook",
        errorCode: "STRIPE_WEBHOOK_SIGNATURE_FAILED",
        severity: "medium"
      });
      return toErrorResponse(normalized, ctx.requestId, {
        area: "stripe",
        action: "webhook",
        errorCode: "STRIPE_WEBHOOK_SIGNATURE_FAILED",
        route: "POST /api/stripe/webhook"
      });
    }

    ctx.captureException("stripe webhook failed", error, {
      origin: "server",
      step: "process-webhook",
      area: "stripe",
      action: "webhook",
      errorCode: "STRIPE_WEBHOOK_FAILED",
      severity: "high"
    });
    return toErrorResponse(error, ctx.requestId, {
      area: "stripe",
      action: "webhook",
      errorCode: "STRIPE_WEBHOOK_FAILED",
      severity: "high",
      route: "POST /api/stripe/webhook"
    });
  }
}
