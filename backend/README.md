# Briefops Backend (MVP)

Backend API for a multi-tenant SaaS briefing app built with Next.js App Router, Supabase (Auth + Postgres + RLS), Stripe subscriptions, and PDF export.

## 1) Run Supabase schema

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Run [`supabase/schema.sql`](./supabase/schema.sql).
4. (Optional) Run [`supabase/seed.sql`](./supabase/seed.sql) after creating at least one Auth user.

This creates:
- `profiles`, `organizations`, `memberships`
- `briefings`, `briefing_modules` (`jsonb`)
- `public_links`, `usage_counters`
- RLS + policies + triggers + indexes

## 2) Fill environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set all variables:

- `NEXT_PUBLIC_SUPABASE_URL` (client-safe)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-safe)
- `SUPABASE_SERVICE_ROLE_KEY` (**server only**)
- `STRIPE_SECRET_KEY` (**server only**)
- `STRIPE_WEBHOOK_SECRET` (**server only**)
- `STRIPE_PRICE_ID`
- `APP_URL`
- `NODE_ENV`

Validation is enforced in `src/env.ts`. Server crashes on missing/invalid values.

## 3) Launch the project

```bash
npm install
npm run dev
```

Server starts on `http://localhost:3000`.

## 4) Configure Stripe webhook locally

Install Stripe CLI, login, then forward events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the generated webhook signing secret into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

Useful test event:

```bash
stripe trigger checkout.session.completed
```

## 5) Test PDF export free vs pro

### Free user
1. Ensure `profiles.plan = 'free'` for the user.
2. Call `GET /api/pdf/:id` with `Authorization: Bearer <supabase_access_token>`.
3. First 3 exports in the month succeed.
4. 4th export returns HTTP `402` with `Monthly PDF export limit reached for free plan`.

### Pro user
1. Set `profiles.plan = 'pro'` manually or trigger Stripe webhook updates.
2. Call `GET /api/pdf/:id` repeatedly.
3. Exports remain allowed (no monthly cap).

## API summary

- `GET/POST /api/briefings`
- `GET/PATCH/DELETE /api/briefings/:id`
- `GET/PUT/DELETE /api/briefings/:id/modules`
- `GET/POST /api/briefings/:id/share`
- `GET /api/public/:token`
- `GET /api/pdf/:id`
- `POST /api/stripe/webhook`

## Notes

- Multi-tenant security is enforced by Postgres RLS policies.
- Public sharing is token-based read-only via `x-briefing-token` header injection.
- Stripe webhook updates `profiles.plan` and `profiles.stripe_customer_id`.
