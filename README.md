# BriefOPS

BriefOPS est une application SaaS orientée operations evenementielles. Le produit permet de creer des briefings terrain, d'activer des modules metier, de generer des exports PDF, de partager des versions publiques ciblees et de gerer un workspace avec onboarding, quota et abonnement.

## Vue d'ensemble

- Monorepo Node.js 20+
- Front principal en `frontend/` avec Next.js 15, React 19, TypeScript
- API applicative majoritairement hebergee dans `frontend/app/api`
- Backend legacy/separe dans `backend/` encore present pour tests, scripts et compatibilite
- Base de donnees et auth via Supabase
- Paiement et abonnement via Stripe
- Monitoring via Sentry
- Emails transactionnels via Resend

## Ce que fait le produit

- Authentification utilisateur avec redirection post-login
- Onboarding workspace en plusieurs etapes
- Gestion de workspaces, membres et roles
- Creation de briefings evenementiels
- Edition modulaire des briefings avec preview A4
- Modules metier: metadata, access, delivery, vehicle, equipment, staff, notes, contact
- Export PDF versionne
- Partage public par token avec variantes par audience/team
- Quotas par plan sur briefings, exports PDF et stockage
- Billing Stripe avec webhook et synchronisation workspace
- Interface FR/EN avec tests unitaires, integration et e2e

## Architecture reelle du repo

### `frontend/`

C'est le coeur actif du projet.

- `app/`: couche Next.js App Router
- `app/api/`: endpoints serveur utilises par l'application
- `app/[[...slug]]/`: point d'entree catch-all qui monte l'application SPA React Router
- `src/views/`: pages de l'interface
- `src/components/`: UI, onboarding, editeur de briefing, preview, partage
- `src/lib/`: logique applicative front
- `src/supabase/queries/`: acces donnees et requetes metier
- `src/pdf/`: generation HTML/PDF
- `src/stripe/`: integration Stripe et webhook
- `src/test/`: tests Vitest

Point notable: le projet combine App Router Next.js et une SPA React Router montee dans `frontend/app/[[...slug]]/page.tsx`. C'est une architecture viable, mais hybride.

### `backend/`

Ce dossier contient un backend Next.js separe avec:

- API routes proches de celles du `frontend`
- acces Supabase/Stripe/PDF
- tests dedies
- schema et migrations Supabase

En l'etat, il ressemble a une couche legacy ou parallele. Le deploiement documente dans [DEPLOY_VERCEL.md](/home/moise/Projets/Briefops/DEPLOY_VERCEL.md) indique qu'un projet Vercel unique doit maintenant pointer sur `frontend/`.

### Racine

- `scripts/`: lancement, checks d'environnement, tests, deploy Vercel
- `e2e/`: tests Playwright
- `package.json`: orchestration monorepo

## Schema metier Supabase

Les tables principales visibles dans [schema.sql](/home/moise/Projets/Briefops/backend/supabase/schema.sql) sont:

- `profiles`
- `workspaces`
- `memberships`
- `briefings`
- `modules`
- `workspace_modules`
- `briefing_modules`
- `staff`
- `briefing_exports`
- `public_links`
- `usage_counters`

Le modele montre un produit multi-tenant centre sur le workspace, avec RLS, roles, modules configurables, partage public et suivi de consommation.

## Parcours fonctionnels

### 1. Onboarding

L'utilisateur cree ou rejoint un workspace, choisit un contexte produit puis termine un parcours guide.

### 2. Edition d'un briefing

Un briefing contient un coeur de donnees (titre, date, lieu) et une liste de modules. L'editeur permet:

- activation/desactivation des modules
- edition des formulaires par module
- disposition visuelle sur une grille
- audience par equipe
- autosave + sauvegarde manuelle
- preview A4

### 3. Export et partage

- creation d'un export PDF versionne
- stockage du PDF dans Supabase Storage
- partage public par lien tokenise
- variantes staff ou audience taggee

### 4. Billing

- checkout Stripe
- portail client Stripe
- webhook de synchronisation abonnement -> workspace
- quotas metier derives du plan

## Stack technique

- Next.js 15
- React 19
- TypeScript
- React Router
- TanStack Query
- Supabase JS
- Stripe
- Sentry
- Vitest
- Playwright
- Tailwind CSS
- Zod
- Puppeteer Core / Chromium pour PDF

## Chiffres utiles observes dans le repo

- environ 60 handlers API declares entre `frontend/app/api` et `backend/app/api`
- 57 fichiers de tests detectes entre `frontend/src/test`, `backend/tests` et `e2e`

## Lancer le projet

### Prerequis

- Node.js 20+
- npm
- un projet Supabase
- des cles Stripe si le billing doit fonctionner

### Installation

```bash
npm install
npm --prefix frontend install
npm --prefix backend install
```

### Variables d'environnement

Copier:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env.local
```

Variables importantes:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_ID`
- `STRIPE_PLUS_ID`
- `STRIPE_PRO_ID`
- `APP_URL`
- `RESEND_API_KEY`
- `MAIL_FROM`
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`

### Commandes principales

Depuis la racine:

```bash
npm run dev
```

Demarre le frontend principal.

```bash
npm run dev:all
```

Demarre frontend + backend legacy en parallele.

```bash
npm run test
```

Execute:

- verification des env
- tests backend
- tests frontend
- tests e2e Playwright

Autres commandes utiles:

```bash
npm run test:frontend
npm run test:backend
npm run build
npm run vercel:check
```

## Deploiement

Le mode cible documente est:

- un seul projet Vercel
- `Root Directory = frontend`
- App Router + API routes servis depuis le meme projet

Voir [DEPLOY_VERCEL.md](/home/moise/Projets/Briefops/DEPLOY_VERCEL.md) pour le detail.

## Audit synthese

### Points forts

- Domaine metier deja bien incarne dans le schema et les ecrans
- Bonne couverture fonctionnelle visible
- Base de tests deja significative
- Separation claire des briques metier: auth, briefing, modules, sharing, export, billing
- Quotas et planification deja modelises cote data et API

### Points d'attention

- Duplication importante entre `frontend/` et `backend/`
- Architecture hybride Next App Router + SPA React Router qui augmente la complexite
- Nommage parfois melange entre `org` et `workspace`, signe d'une evolution en cours
- Documentation fragmentee: plusieurs README partiels mais pas de README racine central jusqu'ici
- Scripts et docs conservent encore des references au backend legacy, ce qui peut embrouiller l'onboarding technique

### Recommandations

- Clarifier officiellement si `backend/` doit rester supporte ou etre archive
- Choisir une cible d'architecture unique a moyen terme:
  soit full Next App Router,
  soit front SPA + API distincte,
  mais eviter la double couche durablement
- Unifier le vocabulaire `workspace` / `org`
- Completer ce README avec un schema d'architecture si le projet continue de grossir
- Prioriser une doc de setup Supabase + Stripe pas-a-pas pour accelerer les reprises

## Structure resumee

```text
.
├── frontend/                # application principale
│   ├── app/                 # App Router + API routes
│   ├── src/components/      # UI et modules
│   ├── src/views/           # pages SPA
│   ├── src/lib/             # logique metier
│   ├── src/supabase/        # acces donnees
│   ├── src/pdf/             # rendu/export PDF
│   └── src/test/            # tests frontend
├── backend/                 # backend legacy / parallele
│   ├── app/api/             # routes API
│   ├── src/                 # logique serveur
│   ├── supabase/            # schema, seed, migrations
│   └── tests/               # tests backend
├── e2e/                     # tests Playwright
├── scripts/                 # scripts projet
└── DEPLOY_VERCEL.md         # notes de deploiement
```

## Etat actuel en une phrase

BriefOPS est deja un SaaS operations-oriented avance, avec un coeur produit coherent et bien maquette techniquement, mais il gagnerait en lisibilite et en maintenabilite avec une consolidation de son architecture et de sa documentation.
