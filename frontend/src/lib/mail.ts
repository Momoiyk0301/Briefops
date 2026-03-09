import Stripe from "stripe";

import { env } from "@/env";
import { isDev } from "@/stripe/stripe";

type MailConfig = {
  apiKey: string;
  from: string;
};

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
};

export type BillingPlan = "free" | "starter" | "plus" | "pro";

function getMailConfig(): MailConfig | null {
  const apiKey = String(process.env.RESEND_API_KEY ?? "").trim();
  const from = String(process.env.MAIL_FROM ?? "").trim();
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

export function isMailEnabled() {
  return Boolean(getMailConfig());
}

export async function sendTransactionalEmail(input: SendMailInput) {
  const config = getMailConfig();
  if (!config) {
    if (isDev) {
      console.info("[mail] skipped: RESEND_API_KEY or MAIL_FROM missing");
    }
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: config.from,
      to: [input.to],
      subject: input.subject,
      html: input.html
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Resend error: ${message}`);
  }
}

function renderMailShell(title: string, content: string, ctaLabel?: string, ctaHref?: string) {
  const action = ctaLabel && ctaHref
    ? `<p style="margin-top:24px;"><a href="${ctaHref}" style="display:inline-block;border-radius:9999px;background:#1d4ed8;color:#fff;text-decoration:none;padding:12px 18px;font-weight:600;">${ctaLabel}</a></p>`
    : "";

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
      <div style="margin-bottom:24px;">
        <div style="width:42px;height:42px;border-radius:14px;background:#1d4ed8;color:#fff;font-weight:700;font-size:20px;display:flex;align-items:center;justify-content:center;">B</div>
      </div>
      <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;">${title}</h1>
      <div style="font-size:15px;color:#374151;">${content}</div>
      ${action}
      <p style="margin-top:32px;font-size:12px;color:#6b7280;">BriefOPS · events-ops.be</p>
    </div>
  `;
}

export async function sendCheckoutConfirmationEmails(email: string, plan: BillingPlan, session: Stripe.Checkout.Session) {
  if (plan === "free") return;

  const appUrl = env.APP_URL.replace(/\/$/, "");
  const sessionId = session.id ?? "n/a";
  const amount = typeof session.amount_total === "number" ? (session.amount_total / 100).toFixed(2) : null;
  const currency = (session.currency ?? "eur").toUpperCase();

  await sendTransactionalEmail({
    to: email,
    subject: `Commande BriefOPS confirmée (${plan.toUpperCase()})`,
    html: renderMailShell(
      "Commande confirmée",
      `
        <p>Ton abonnement <strong>${plan.toUpperCase()}</strong> est maintenant actif.</p>
        <p>Session Stripe : <code>${sessionId}</code></p>
        ${amount ? `<p>Montant payé : <strong>${amount} ${currency}</strong></p>` : ""}
        <p>Les reçus et factures Stripe restent gérés par Stripe selon la configuration de ton compte.</p>
      `,
      "Accéder à BriefOPS",
      `${appUrl}/briefings`
    )
  });

  await sendTransactionalEmail({
    to: email,
    subject: "Compte BriefOPS activé",
    html: renderMailShell(
      "Compte activé",
      `
        <p>Ton paiement a été validé et ton compte BriefOPS est bien actif.</p>
        <p>Tu peux reprendre ton onboarding ou accéder directement à ton espace.</p>
      `,
      "Ouvrir mon espace",
      `${appUrl}/auth/confirmed`
    )
  });
}
