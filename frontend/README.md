# BriefOPS Frontend

React + Vite + TypeScript frontend with Tailwind, Supabase Auth, React Query and modular briefing editor.

## Run

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Env

`frontend/.env.local`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:3000
VITE_E2E_MOCK_AUTH=false
```

## Tests

Unit/integration:

```bash
cd frontend
npm run test
```

E2E is configured at monorepo root via Playwright.

## Mock fallback policy

When backend data is unavailable, the app uses explicit demo fallback for briefings list:
- UI badge: `Demo data`
- console log: `[MOCK DATA] briefings list fallback used because <reason>`

If `/api/me` is unavailable, fallback user context is used and the app logs:
- `[MOCK DATA] me fallback used because <reason>`

## UX highlights

- Desktop-first editor with A4 preview (WYSIWYG)
- Metadata always visible
- Module registry architecture (add module = registry + form + preview)
- Autosave + manual save
- PDF export with paywall handling and billing CTA
- FR/EN + dark/light toggles
