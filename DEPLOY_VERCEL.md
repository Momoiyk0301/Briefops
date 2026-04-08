# Déploiement Vercel

BriefOPS se déploie maintenant comme une seule application Next.js à la racine du repo.

## Projet Vercel

- `Framework Preset`: Next.js
- `Root Directory`: `.`
- `Build Command`: `npm run build`
- `Install Command`: `npm install`

## Variables d’environnement

Configurer en Production et Preview:

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

Optionnel:

- `NEXT_PUBLIC_API_URL` vide pour rester en same-origin
- `NEXT_PUBLIC_E2E_MOCK_AUTH=false`

## Domaines

- `events-ops.be` pour la landing
- `briefing.events-ops.be` pour l’application

Le `middleware.ts` prépare la séparation de trafic côté code:

- host marketing -> landing localisée
- host app -> SPA métier + API
- chemins app ouverts depuis le host marketing -> redirection vers l’host app

## Validation avant mise en prod

```bash
npm run validate
```

## Points d’attention

- vérifier les redirects/auth Supabase avec `APP_URL=briefing.events-ops.be`
- vérifier les CTA landing vers l’host app
- configurer les domaines publics de partage de briefing si nécessaire côté produit

