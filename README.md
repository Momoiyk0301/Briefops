# BriefOPS

BriefOPS est un SaaS de briefings événementiels conçu pour produire des documents terrain clairs, modulaires et partageables sans surcharger le workflow opérationnel.

## Cible V1

- une seule application Next.js déployable sur Vercel
- une landing marketing séparée de l’app métier
- une app SaaS centrée sur l’auth, l’onboarding, les briefings, le partage et la facturation
- une base de tests utile sur les flows critiques

## Structure actuelle

```text
.
├── app/                     # App Router Next.js + API routes + landing localisée
├── public/                  # assets statiques
├── src/
│   ├── components/          # UI app
│   ├── i18n/                # i18n app + marketing
│   ├── lib/                 # helpers, URLs, logging, auth, API
│   ├── marketing/           # landing page et composants marketing
│   ├── modules/             # rendu modulaire briefing/pdf
│   ├── pdf/                 # génération HTML/PDF
│   ├── supabase/queries/    # accès data
│   ├── test/                # tests Vitest actifs
│   └── views/               # vues SPA métier
├── supabase/                # migrations et seed
├── archive/
│   ├── backend-legacy/      # ancien backend archivé
│   └── frontend-legacy/     # ancien frontend archivé
└── middleware.ts            # séparation landing/app par host
```

## Domaines prévus

- `events-ops.be` sert la landing marketing
- `briefing.events-ops.be` sert l’application SaaS

En local et en preview, la même app supporte les deux usages via `middleware.ts`.

## Localisation

- landing marketing: `/{locale}` avec `fr` et `nl`
- app métier: i18n applicative centralisée dans `src/i18n` avec `fr` et `en`

## Variables d’environnement importantes

Copier `.env.example` vers `.env.local`, puis renseigner au minimum:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL`
- `MARKETING_SITE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_ID`
- `STRIPE_PLUS_ID`
- `STRIPE_PRO_ID`

## Commandes utiles

```bash
npm install
npm run dev
npm test
npm run build
npm run validate
```

## Observabilité

- Sentry pour les erreurs client/serveur
- logging structuré et redaction légère dans `src/lib/logger.ts`
- Vercel Analytics et Speed Insights intégrés dans `app/layout.tsx`

## Notes

- le code actif vit désormais à la racine
- les anciens dossiers `frontend/` et `backend/` sont archivés dans `archive/`
- les tests legacy archivés ne font plus partie du périmètre de validation V1

