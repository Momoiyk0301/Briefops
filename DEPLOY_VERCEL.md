# Deploy Vercel (Projet Unique)

Ce repo se deploye maintenant avec **un seul projet Vercel**:
- Root Directory: `frontend`
- Framework: Next.js

## 1) Import du repo sur Vercel

1. `Add New Project` puis choisir le repository.
2. Dans `Root Directory`, selectionner `frontend`.
3. Laisser les commandes par defaut Next.js (`build` / `start`) detectees par Vercel.

## 2) Variables d'environnement a configurer

Ajouter ces variables dans Vercel (Production + Preview, et Development si besoin):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_ID`
- `STRIPE_PLUS_ID`
- `STRIPE_PRO_ID`
- `APP_URL` (URL publique du frontend, ex: `https://briefops.vercel.app`)
- `NODE_ENV=production`

Optionnel:
- `NEXT_PUBLIC_API_URL` vide pour utiliser le meme domaine (`/api`)
- `NEXT_PUBLIC_E2E_MOCK_AUTH=false`

## 3) Commandes locales utiles

Depuis la racine du repo:

```bash
npm run dev          # frontend only
npm run dev:all      # frontend + backend legacy en parallele
npm run test         # env + backend tests + frontend tests + e2e
```
