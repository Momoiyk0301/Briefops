# BriefOPS Frontend

Frontend MVP for BriefOPS built with React + Vite + TypeScript.

## Stack

- React + Vite + TypeScript
- TailwindCSS
- React Router
- Supabase Auth (client)
- TanStack Query
- React Hook Form + Zod
- react-i18next (FR/EN)
- react-hot-toast
- lucide-react

## Setup

```bash
cd frontend
cp .env.example .env.local
```

Fill `.env.local`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:3000
```

Install and run:

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Routing

- `/login`
- `/onboarding`
- `/briefings`
- `/briefings/:id`
- `/settings/billing`

## API integration

The app sends `Authorization: Bearer <access_token>` for all backend calls.

Implemented endpoints:

- `GET /api/briefings`
- `POST /api/briefings`
- `GET /api/briefings/:id`
- `PATCH /api/briefings/:id`
- `GET /api/briefings/:id/modules`
- `PUT /api/briefings/:id/modules` (called in loop for batch upsert)
- `GET /api/pdf/:id`

Adapter with documented fallback:

- `GET /api/me`
  - if missing, fallback to Supabase session user and set `degraded=true`.
- `POST /api/onboarding`
  - if missing, frontend shows a clear fallback error toast/message.

## Editor behavior

- Left: fixed A4 preview (WYSIWYG rendering)
- Right: metadata form + modules toggles + selected module form
- Metadata module is mandatory and always visible
- Autosave debounce (800ms) + explicit save button
- PDF export by authenticated fetch + blob download
- On 402/403: toast and CTA to billing page

## Add a new module

1. Add schema + defaults + labels + components in `src/lib/moduleRegistry.ts`
2. Create module form component in `src/components/briefing/forms/`
3. Create preview component in `src/components/briefing/preview/`

No editor engine changes required.

## i18n and theme

- Language toggle FR/EN in navbar (persisted in `localStorage`)
- Dark/light mode toggle in navbar (persisted in `localStorage`)

## Test flow

1. Register/login via email/password.
2. Go to onboarding and submit org name (or observe fallback if endpoint missing).
3. Create a briefing from `/briefings`.
4. Edit metadata + modules and verify live A4 preview.
5. Save manually and confirm toast.
6. Trigger autosave by changing fields and waiting >800ms.
7. Download PDF and verify success/failure handling.
