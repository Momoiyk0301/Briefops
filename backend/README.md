# Briefops Backend

Next.js API backend with Supabase, Stripe webhook and PDF export.

## Run

```bash
cd backend
cp .env.example .env.local
npm install
npm run dev
```

Or via script:

```bash
./scripts/start.sh
```

## Env

Required in `backend/.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_ID`
- `STRIPE_PLUS_ID` (ou `STRPE_PLUS_ID`)
- `STRIPE_PRO_ID`
- `APP_URL`
- `NODE_ENV`

## API

- `GET /api/me`
- `POST /api/onboarding`
- `GET/POST /api/briefings`
- `GET/PATCH/DELETE /api/briefings/:id`
- `GET/PUT/DELETE /api/briefings/:id/modules`
- `GET /api/pdf/:id`
- `POST /api/stripe/webhook`
- `GET /api/public/:token`

## Tests

```bash
cd backend
npm run test
```

Or:

```bash
./scripts/test.sh
```

Included tests cover:
- auth required behavior on private routes
- briefing creation/list route behaviors
- PDF limit handling for free plan
- stripe webhook signature invalid/valid flows
- public token route protection behavior
