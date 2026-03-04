# Deploy Monorepo sur Vercel

Ce repo est pret pour un deploiement monorepo avec **2 projets Vercel** relies au meme repository:

1. `briefops-backend` (Root Directory: `backend`)
2. `briefops-frontend` (Root Directory: `frontend`)

## 1) Projet Backend

- Framework detecte: Next.js (`backend/vercel.json`)
- Root Directory: `backend`
- Variables d'environnement a configurer:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_START_PRICE_ID`
  - `STRIPE_PRO_PRICE_ID`
  - `APP_URL` (URL frontend publique)

## 2) Projet Frontend

- Framework detecte: Vite (`frontend/vercel.json`)
- Root Directory: `frontend`
- Variable d'environnement:
  - `VITE_API_URL=https://<url-backend-vercel>`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- La rewrite SPA est deja configuree pour React Router.

## 3) Deploiement CLI (optionnel)

Prerequis: chaque dossier (`backend`, `frontend`) deja lie a son projet Vercel.

```bash
./scripts/vercel-deploy-all.sh
```

Ce script declenche un deploy backend puis frontend depuis le monorepo.
