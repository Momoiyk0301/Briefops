import { NextResponse } from "next/server";
import { z } from "zod";

import { createRequestContext, toErrorResponse } from "@/http";
import { sendTransactionalEmail } from "@/lib/mail";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
  context: z.object({
    userId: z.string().trim().max(120).optional().nullable(),
    workspaceId: z.string().trim().max(120).optional().nullable(),
    currentUrl: z.string().trim().max(500).optional().nullable(),
    userAgent: z.string().trim().max(500).optional().nullable(),
    timestamp: z.string().trim().max(80).optional().nullable(),
    appVersion: z.string().trim().max(80).optional().nullable()
  }).optional()
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  const ctx = createRequestContext("POST /api/support", request);

  try {
    const body = bodySchema.parse(await request.json());

    const supportRecipient =
      String(process.env.SUPPORT_EMAIL ?? "").trim() ||
      String(process.env.MAIL_FROM ?? "").trim().replace(/^.*<(.+)>$/, "$1");

    if (!supportRecipient) {
      ctx.warn("support email not configured, skipping send");
      return NextResponse.json({ ok: true });
    }

    await sendTransactionalEmail({
      to: supportRecipient,
      kind: "support",
      subject: `[Support BriefOPS] ${escapeHtml(body.subject)}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
          <h2 style="margin:0 0 16px;">Nouvelle demande de support</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:6px 0;color:#6b7280;width:100px;">Nom</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(body.name)}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(body.email)}">${escapeHtml(body.email)}</a></td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Sujet</td><td style="padding:6px 0;">${escapeHtml(body.subject)}</td></tr>
          </table>
          <div style="margin-top:20px;padding:16px;background:#f9fafb;border-radius:8px;font-size:14px;white-space:pre-wrap;">${escapeHtml(body.message)}</div>
          ${body.context ? `
            <div style="margin-top:20px;padding:16px;background:#f3f4f6;border-radius:8px;font-size:12px;color:#4b5563;">
              <strong>Contexte</strong><br />
              userId: ${escapeHtml(body.context.userId ?? "n/a")}<br />
              workspaceId: ${escapeHtml(body.context.workspaceId ?? "n/a")}<br />
              currentUrl: ${escapeHtml(body.context.currentUrl ?? "n/a")}<br />
              userAgent: ${escapeHtml(body.context.userAgent ?? "n/a")}<br />
              timestamp: ${escapeHtml(body.context.timestamp ?? "n/a")}<br />
              appVersion: ${escapeHtml(body.context.appVersion ?? "n/a")}
            </div>
          ` : ""}
          <p style="margin-top:16px;font-size:12px;color:#9ca3af;">Répondre directement à <a href="mailto:${escapeHtml(body.email)}">${escapeHtml(body.email)}</a></p>
        </div>
      `,
      tags: { source: "briefops-app", flow: "support" }
    });

    ctx.info("support email sent", { hasContext: Boolean(body.context) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    ctx.captureException("support email failed", error, {
      origin: "server",
      step: "send-support-email",
      area: "support",
      action: "send",
      errorCode: "SUPPORT_REQUEST_FAILED",
      severity: "medium"
    });
    return toErrorResponse(error, ctx.requestId, {
      area: "support",
      action: "send",
      errorCode: "SUPPORT_REQUEST_FAILED",
      route: "POST /api/support"
    });
  }
}
