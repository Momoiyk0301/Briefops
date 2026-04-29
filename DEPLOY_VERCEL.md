# Déploiement Vercel

BriefOPS se déploie maintenant comme deux applications Next.js dans un monorepo npm.

## Projets Vercel

Créer deux projets Vercel reliés au même repo:

### `briefops-landing`

- `Framework Preset`: Next.js
- `Root Directory`: `apps/landing`
- `Build Command`: `npm run build`
- domaines: `events-ops.be`, `www.events-ops.be`

### `briefops-app`

- `Framework Preset`: Next.js
- `Root Directory`: `apps/app`
- `Build Command`: `npm run build`
- domaine: `briefing.events-ops.be`

## Variables d’environnement

Variables communes aux deux projets:

- `APP_URL=https://briefing.events-ops.be`
- `MARKETING_SITE_URL=https://events-ops.be`

Variables à configurer sur `briefops-app`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL`
- `MARKETING_SITE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_ID`
- `STRIPE_PLUS_ID`
- `STRIPE_PRO_ID`
- `RESEND_API_KEY`
- `MAIL_FROM`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`

Optionnel sur `briefops-app`:

- `NEXT_PUBLIC_API_URL` vide pour rester en same-origin
- `NEXT_PUBLIC_E2E_MOCK_AUTH=false`

## Domaines

- `events-ops.be` pour la landing
- `briefing.events-ops.be` pour l’application

Chaque app a son propre `middleware.ts`:

- `apps/landing`: sert `/`, `/{fr,nl,en}` et redirige les chemins app vers `APP_URL`
- `apps/app`: sert la SPA métier, les API, les partages publics et redirige les chemins marketing vers `MARKETING_SITE_URL`

## Validation avant mise en prod

```bash
npm run validate
npm run build:landing
npm run build:app
```

## Points d’attention

- vérifier les redirects/auth Supabase avec `APP_URL=briefing.events-ops.be`
- vérifier les CTA landing vers l’host app
- configurer les domaines publics de partage de briefing si nécessaire côté produit
