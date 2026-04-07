# BriefOPS Agent Notes

## Produit
- SaaS MVP pour les opérations événementielles
- coeur métier: briefings terrain, modules, PDF, partage public, workspace, onboarding, billing

## Stack
- `frontend/`: Next.js 15, React 19, TypeScript, Tailwind
- Supabase: auth, DB, storage
- Stripe: checkout, billing, webhooks
- Resend: emails applicatifs
- Sentry: monitoring
- Vercel: cible de déploiement

## Architecture
- déploiement cible: un seul projet Vercel avec `Root Directory = frontend`
- `frontend/app/api`: API active
- `frontend/app/[[...slug]]`: shell SPA React Router
- `backend/`: legacy / compat / tests / scripts

## Règles
- priorité à la clarté, la robustesse et la vitesse
- pas de sur-ingénierie
- composants petits et ciblés
- ne pas casser l’auth, le billing ni les RLS
- erreurs visibles, traçables, utiles

## Flux email
- Stripe: factures et reçus financiers
- Supabase Auth: confirmation email, reset password, magic link via SMTP Resend
- BriefOPS app: mails applicatifs via API Resend

## Points d’attention
- architecture hybride Next App Router + SPA React Router
- duplication encore présente avec `backend/`
- vocabulaire parfois mixte `org` / `workspace`
