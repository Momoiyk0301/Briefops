import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const MAIL_FROM = process.env.MAIL_FROM ?? "BriefOPS <noreply@events-ops.be>";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const source = typeof body?.source === "string" ? body.source : "landing";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Config manquante" }, { status: 500 });
  }

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal,resolution=ignore-duplicates"
    },
    body: JSON.stringify({ email, source })
  });

  if (!insertRes.ok && insertRes.status !== 409) {
    const msg = await insertRes.text();
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [email],
        subject: "Tu es sur la liste d'attente BriefOPS 🎉",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111827;">
            <div style="width:42px;height:42px;border-radius:14px;background:#1d4ed8;color:#fff;font-weight:700;font-size:20px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;">B</div>
            <h1 style="margin:0 0 16px;font-size:24px;">Confirmation d'inscription a la waitlist</h1>
            <p style="font-size:15px;color:#374151;">
              Tu es bien inscrit(e) sur la waitlist <strong>BriefOPS</strong>. Merci pour ta confiance.
            </p>
            <p style="font-size:15px;color:#374151;">
              Nous t'enverrons un email des que la beta sera ouverte, avec toutes les infos pour y acceder.
            </p>
            <p style="margin-top:32px;font-size:12px;color:#6b7280;">BriefOPS · events-ops.be</p>
          </div>
        `
      })
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
