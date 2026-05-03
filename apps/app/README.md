# BriefOPS App

Application SaaS BriefOPS: espace connecté pour créer, gérer, partager et exporter des briefings événementiels.

## Rôle

- authentification et session utilisateur via Supabase Auth
- onboarding workspace
- gestion des briefings, modules, équipe, documents et liens publics
- API métier Next.js App Router
- génération PDF et exports
- paiement Stripe: checkout, portal et webhook
- emails transactionnels via Resend
- observabilité Sentry, Vercel Analytics et Speed Insights

## Structure

```text
apps/app/
├── app/                 # routes Next.js, pages, API routes, layouts
├── public/              # assets statiques de l'app
├── src/
│   ├── components/      # UI et composants métier
│   ├── lib/             # clients, helpers API, auth, monitoring, sites
│   ├── pdf/             # rendu HTML/PDF des briefings
│   ├── stripe/          # intégration Stripe
│   ├── test/            # tests Vitest
│   └── views/           # vues principales de la SPA
├── middleware.ts        # protection d'accès et redirections cross-site
├── next.config.mjs
└── vercel.json
```

## Commandes

Depuis la racine du repo:

```bash
npm run dev:app
npm run test:app
npm run build:app
```

Depuis `apps/app`:

```bash
npm run dev
npm run test
npm run build
```

## Variables d'environnement

Les variables sont chargees depuis la racine du repo par `next.config.mjs` et `src/env.ts`.

Minimum requis:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL`
- `MARKETING_SITE_URL`

Fonctionnalites serveur:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_ID`
- `STRIPE_PLUS_ID`
- `STRIPE_PRO_ID`
- `RESEND_API_KEY`
- `MAIL_FROM`

Observabilite:

- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_TRACES_SAMPLE_RATE`
- `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

Optionnel:

- `NEXT_PUBLIC_API_URL` peut rester vide pour utiliser les API same-origin
- `NEXT_PUBLIC_E2E_MOCK_AUTH=false` en production

## Routage

Le domaine de production attendu est:

```text
https://briefing.events-ops.be
```

`middleware.ts`:

- protege les routes app avec le cookie `site_access`
- laisse passer `/access`, `/api`, `/_next`, les assets et les fichiers statiques
- redirige les routes marketing localisees vers `MARKETING_SITE_URL`
- redirige `/` vers `/login` si l'acces site est deja accorde

## Deploiement Vercel

Projet Vercel recommande:

- nom: `briefops-app`
- framework: Next.js
- root directory: `apps/app`
- build command: `npm run build`
- domaine: `briefing.events-ops.be`

Les variables Supabase, Stripe, Resend et Sentry doivent etre configurees dans les Environment Variables du projet Vercel. Le fichier `.env.prod` sert d'aide locale, mais Vercel ne le lit pas automatiquement.
