# BriefOPS Landing

Site marketing public BriefOPS: presentation produit, pages SEO localisees, sitemap et robots.

## Rôle

- servir la landing marketing sur `events-ops.be`
- gerer les locales marketing `fr`, `nl` et `en`
- exposer les pages SEO `event briefing template` et `briefing generator`
- rediriger les routes applicatives vers l'app SaaS
- publier le sitemap et le fichier robots
- embarquer Vercel Analytics et Speed Insights

## Structure

```text
apps/landing/
├── app/                 # routes Next.js marketing, sitemap, robots
│   ├── en/
│   ├── fr/
│   └── nl/
├── public/              # assets statiques de la landing
├── src/
│   ├── i18n/            # dictionnaires marketing
│   ├── lib/             # routage landing
│   ├── marketing/       # composants et metadata marketing
│   └── test/            # tests Vitest
├── middleware.ts        # normalisation locale et redirections vers l'app
├── next.config.mjs
└── vercel.json
```

## Commandes

Depuis la racine du repo:

```bash
npm run dev:landing
npm run test:landing
npm run build:landing
```

Depuis `apps/landing`:

```bash
npm run dev
npm run test
npm run build
```

## Variables d'environnement

La landing utilise surtout les URLs partagees du monorepo:

- `APP_URL=https://briefing.events-ops.be`
- `MARKETING_SITE_URL=https://events-ops.be`

Ces variables servent aux redirections, au sitemap et aux liens marketing. Les secrets Supabase, Stripe, Resend et Sentry ne sont pas necessaires pour la landing dans l'etat actuel.

## Routage

Le domaine de production attendu est:

```text
https://events-ops.be
```

Routes principales:

- `/`
- `/fr`, `/nl`, `/en`
- `/{locale}/event-briefing-template`
- `/{locale}/briefing-generator`
- `/sitemap.xml`
- `/robots.txt`

`middleware.ts`:

- laisse passer les assets, `/_next`, `favicon.ico`, `logo.ico`, `robots.txt` et `sitemap.xml`
- sert directement `/` et les routes localisees
- redirige les chemins app comme `/login`, `/briefings`, `/settings` vers `APP_URL`
- normalise les chemins inconnus vers la locale detectee

## Deploiement Vercel

Projet Vercel recommande:

- nom: `briefops-landing`
- framework: Next.js
- root directory: `apps/landing`
- build command: `npm run build`
- domaines: `events-ops.be`, `www.events-ops.be`

Configurer au minimum `APP_URL` et `MARKETING_SITE_URL` dans les Environment Variables Vercel du projet landing.
