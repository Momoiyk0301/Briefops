🎯 Project Mission

This project is a SaaS for the event industry.

The goal is to generate structured, modular event briefings for field teams (roadies, stage managers, staff managers, event crew).

The MVP must focus only on:

Creating a briefing

Activating/deactivating modules

Exporting or sharing the briefing

Basic subscription restriction (Stripe)

No over-engineering.
Speed and clarity over complexity.

🧠 Product Philosophy

This is a real-world tool built from field experience.

Priorities:

Clarity of information

Simplicity of UI

Modular structure

Fast creation workflow

Mobile-friendly interface

Every feature must answer:
"Does this reduce confusion on the field?"

If not, do not build it.

🏗 Technical Stack

Frontend:

React 

TailwindCSS

Backend / DB:

Supabase (Postgres + Auth + RLS Storage
Stoage  bucket : exports, logos, assets
Payments:

Stripe

Deployment:

Vercel

Security and observability:

Supabase RLS

Stripe webhook signatures

Sentry

Vercel Analytics / Speed Insights

📦 Architecture Rules

Keep database schema simple.

Use JSON fields for module data (avoid premature normalization).

One organization per user for MVP.

Use server-side routes for sensitive operations (PDF generation, Stripe webhooks).

Always implement RLS policies.

Never expose private Supabase storage paths through signed URLs without checking ownership or workspace membership.

Service role is allowed only inside server code and only after app-level authorization.

Public sharing must use random tokens, expiration/revocation checks, and least-data public rendering.

⚙️ Coding Rules

No unnecessary abstractions.

No premature optimization.

Prefer readable code over clever code.

Keep components small and focused.

Reuse logic when possible.

Always explain what files were modified.

Environment files rule:
- Do not modify existing environment variables (values already defined).
- Creating `.env` files is allowed.
- Adding new environment variables is allowed.
- Never commit real `.env` files or secret values.

Security rules:
- Validate all API input with Zod or an equivalent schema.
- Keep Stripe webhook verification on raw request text.
- Escape user-controlled HTML in emails.
- Do not log secrets, bearer tokens, signatures, raw emails, passwords, Stripe IDs, or API keys.
- Prefer short-lived signed URLs.
- Add or update tests when changing auth, storage, billing, sharing, PDF, or RLS-adjacent logic.

Validation before handoff:
- Run focused tests for the changed surface.
- Run `npm test` for broad changes.
- Run `npm run build` before release/deploy changes.
- Run `npm audit` during security work and document unresolved findings.

🧩 How AI Should Work

When implementing a feature:

Explain the approach briefly.

Show file structure changes.

Provide code per file.

Explain how to test it locally.

Never rewrite the entire project unless explicitly requested.

If something is unclear, make the simplest assumption and proceed.

don't delete SQL file

## Points d’attention
- architecture hybride Next App Router + SPA React Router
- legacy archivé dans `archive/`; ne pas modifier sauf demande explicite
- vocabulaire parfois mixte `org` / `workspace`
- i18n app centralisée dans `src/i18n/locales` avec `fr`, `nl`, `en`
- pages marketing SEO localisées dans `app/{fr,nl,en}/...` et contenu dans `src/i18n/marketing.ts`
