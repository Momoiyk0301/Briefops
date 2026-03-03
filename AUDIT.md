# AUDIT BriefOPS Monorepo

## 1) État actuel (scan)

- Monorepo avec:
  - `backend/` (Next API routes + Supabase + Stripe + PDF)
  - `frontend/` (Vite + React + Tailwind)
- Scripts existants initiaux incomplets au niveau monorepo
- Contrat API incomplet côté backend pour frontend (`/api/me`, `/api/onboarding` manquants)
- Observabilité limitée (pas de request id commun)
- Couverture tests absente

## 2) Problèmes identifiés

### Backend

- Contrat API incomplet:
  - `/api/me` absent
  - `/api/onboarding` absent
- Gestion d’erreurs hétérogène (status et format non uniformes)
- Validation inégale des params/path/body selon routes
- Logs peu exploitables (pas de request id)
- Webhook Stripe: gestion baseline ok (signature), mais idempotence explicite absente
- Absence de test suite backend

### Frontend

- UX initiale fonctionnelle mais peu “SaaS premium”
- Fallback data non systématiquement visible/traçable
- Pas de badge UI explicite pour données de démo
- Pas de tests unit/integration/e2e
- Manque d’outillage monorepo pour lancer/tester tout

## 3) Corrections appliquées

## Backend

### Nouvelles routes

- `backend/app/api/me/route.ts`
  - retourne `{ user, plan, org }`
  - gère fallback propre quand profil/org absent

- `backend/app/api/onboarding/route.ts`
  - validation zod (`org_name`)
  - création org + membership owner via service role
  - garde-fou si user déjà onboardé (`409`)

### Robustesse HTTP + logs

- ajout `backend/src/http.ts`
  - `HttpError`
  - `createRequestContext()` (request id + logs structurés)
  - `toErrorResponse()` (format d’erreur unifié)

- routes harmonisées avec validation + codes cohérents + logs:
  - `backend/app/api/briefings/route.ts`
  - `backend/app/api/briefings/[id]/route.ts`
  - `backend/app/api/briefings/[id]/modules/route.ts`
  - `backend/app/api/briefings/[id]/share/route.ts`
  - `backend/app/api/public/[token]/route.ts`
  - `backend/app/api/pdf/[id]/route.ts`
  - `backend/app/api/stripe/webhook/route.ts`

### Stripe

- `backend/src/stripe/webhook.ts`
  - ajout idempotence process-level (`Set` in-memory) pour éviter double traitement immédiat
  - logs dev plus clairs

### Scripts backend

- `backend/scripts/start.sh`
- `backend/scripts/test.sh`

### Tests backend

- config: `backend/vitest.config.ts`
- scripts npm: `test`, `test:watch`
- tests ajoutés:
  - `backend/tests/briefings-route.test.ts`
  - `backend/tests/pdf-route.test.ts`
  - `backend/tests/stripe-webhook-route.test.ts`
  - `backend/tests/public-route.test.ts`

Couverture de base incluse:
- auth required
- create/list briefing
- PDF limit free (402)
- webhook signature invalide (400) + valide (200)
- accès public protégé (token)

## Frontend

### Qualité API/fallback

- `frontend/src/lib/api.ts`
  - ajout `getBriefingsWithFallback()`
  - fallback demo data (2 briefings fictifs)
  - log console obligatoire: `[MOCK DATA] ...`
  - log fallback sur `/api/me`

### UX/design premium

- layout premium desktop-first:
  - `frontend/src/components/layout/AppShell.tsx`
  - `frontend/src/components/layout/Navbar.tsx`
- login copywriting SaaS + section bénéfices:
  - `frontend/src/pages/LoginPage.tsx`
- briefings page:
  - empty state vendeur + CTA
  - badge `Demo data`
  - skeleton loaders
  - bouton accent orange
  - `frontend/src/pages/BriefingsPage.tsx`
- composant skeleton:
  - `frontend/src/components/ui/Skeleton.tsx`

### Auth / testability

- `frontend/src/lib/auth.ts`
  - ajout mode `VITE_E2E_MOCK_AUTH=true` pour e2e
- `frontend/.env.example`
  - ajout `VITE_E2E_MOCK_AUTH=false`

### Tests frontend

- config: `frontend/vitest.config.ts`
- setup: `frontend/src/test/setup.ts`
- tests:
  - `frontend/src/test/button.test.tsx`
  - `frontend/src/test/moduleRegistry.test.ts`
  - `frontend/src/test/login-page.test.tsx`
  - `frontend/src/test/briefings-page.test.tsx`
  - `frontend/src/test/api-fallback.test.ts`

### E2E (Playwright)

- `playwright.config.ts`
- `e2e/app.spec.ts`

Scénarios couverts:
1. login -> onboarding -> create briefing -> save -> export PDF (mock API)
2. erreur API briefings -> fallback demo data + log `[MOCK DATA]`
3. toggle langue + dark mode

## Monorepo scripts

### Root

- `package.json` (monorepo scripts + concurrently + playwright)
- `scripts/start-backend.sh`
- `scripts/start-frontend.sh`
- `scripts/test-all.sh`

Scripts disponibles:
- `npm run dev:backend`
- `npm run dev:frontend`
- `npm run dev`
- `npm run test:backend`
- `npm run test:frontend`
- `npm run test:e2e`
- `npm run test`

## Gitignore

- mise à jour `.gitignore`:
  - `frontend/node_modules`
  - `frontend/dist`
  - coverage/reports/tests artifacts
  - tsbuildinfo

## 4) Commandes d’exécution

## Installation deps

```bash
cd /home/moise/Projets/Briefops
npm install
npm --prefix backend install
npm --prefix frontend install
```

## Lancer backend

```bash
cd /home/moise/Projets/Briefops
./scripts/start-backend.sh
```

## Lancer frontend

```bash
cd /home/moise/Projets/Briefops
./scripts/start-frontend.sh
```

## Lancer les deux

```bash
cd /home/moise/Projets/Briefops
npm run dev
```

## Lancer tous les tests

```bash
cd /home/moise/Projets/Briefops
./scripts/test-all.sh
```

## 5) Limites / suites recommandées

- Idempotence Stripe actuelle process-level (volatile en restart). Recommandé: persistance DB dédiée (`webhook_events`).
- Tests backend actuels basés sur mocks de handlers (rapides); ajouter des tests d’intégration DB réels via environnement Supabase test.
- Bundle frontend > 500kb: appliquer code splitting (`React.lazy` + routes chunking).
