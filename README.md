# BriefOPS

BriefOPS est un SaaS de briefings événementiels conçu pour produire des documents terrain clairs, modulaires et partageables sans surcharger le workflow opérationnel.

## Cible V1

- une seule application Next.js déployable sur Vercel
- une landing marketing séparée de l’app métier
- une app SaaS centrée sur l’auth, l’onboarding, les briefings, le partage et la facturation
- des pages SEO localisées pour `event briefing template` et `briefing generator`
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

- landing marketing: `/{locale}` avec `fr`, `nl` et `en`
- pages SEO: `/{locale}/event-briefing-template` et `/{locale}/briefing-generator`
- app métier: i18n applicative centralisée dans `src/i18n/locales` avec `fr`, `nl` et `en`

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
- `RESEND_API_KEY`
- `MAIL_FROM`
- `SUPPORT_EMAIL`
- `SENTRY_DSN`

## Commandes utiles

```bash
npm install
npm run dev
npm test
npm run build
npm run validate
npm audit
```

## Fonctionnement applicatif

### Authentification et autorisation

- L’app client utilise Supabase Auth.
- Les API métier exigent un bearer token via `requireUser` ou `requireAuthContext`.
- Les accès data côté utilisateur passent par le client Supabase anon avec le token utilisateur, donc les politiques RLS restent le garde-fou principal.
- Les opérations serveur sensibles utilisent le service role uniquement après vérification applicative préalable: PDF, Stripe, storage privé, liens publics.
- Les rôles workspace (`owner`, `admin`, `member`) limitent les actions critiques comme suppression, gestion des liens publics et création de briefings.

### Données et stockage

- Les tables principales sont `profiles`, `workspaces`, `memberships`, `briefings`, `briefing_modules`, `staff`, `public_links`, `briefing_exports`.
- Les données modulaires de briefing sont stockées en JSON dans `briefing_modules.data_json`.
- Les buckets Supabase privés utilisés par l’app sont notamment `exports`, `logos`, `avatars` et `assets`.
- Les URLs signées de storage sont générées côté serveur et doivent rester attachées à l’utilisateur ou au workspace courant.

### Paiement et emails

- Stripe gère checkout, portal et webhooks avec vérification de signature.
- Resend gère les emails transactionnels applicatifs via `RESEND_API_KEY` et `MAIL_FROM`.
- Les emails financiers restent côté Stripe.

## Audit sécurité

Dernier audit local effectué pendant cette mise à jour:

- `npm audit fix` a été exécuté et a corrigé les vulnérabilités hautes remontées par les dépendances transitives.
- `npm audit` reste avec 2 vulnérabilités modérées liées au `postcss` embarqué par `next`. `npm audit fix --force` propose un downgrade cassant vers Next 9.3.3; ne pas l’exécuter tel quel. À traiter via une mise à jour Next compatible dès qu’un correctif propre est disponible.
- Aucun fichier `.env` réel n’est suivi par Git; seuls `.env.example` et l’exemple legacy sont versionnés.
- Le logging centralisé masque les clés usuelles: token, authorization, signature, secret, password, email, stripe, api key.
- Les webhooks Stripe vérifient `stripe-signature`.
- Les routes PDF et partage appliquent un rate limit mémoire. Pour une production multi-instance, remplacer ou compléter par un rate limit distribué.
- Les liens publics utilisent des tokens aléatoires de 24 bytes en base64url, avec expiration et révocation.
- La route `/api/storage/signed-url` vérifie désormais que le chemin demandé appartient à l’utilisateur ou à son workspace avant de générer une URL signée.

### Points à durcir ensuite

- Ajouter des security headers globaux (`Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) et préparer une CSP compatible avec Vercel Analytics, Sentry, Resend et les styles actuels.
- Remplacer le rate limit mémoire par un stockage partagé si plusieurs instances Vercel peuvent recevoir les mêmes attaques.
- Réduire progressivement les usages service role en ajoutant des helpers d’autorisation dédiés et testés pour chaque ressource.
- Ajouter une vérification CI `npm audit --omit=dev` avec seuil explicite et une exception documentée pour les vulnérabilités Next résiduelles.
- Revoir la route login hint si l’énumération d’emails devient un risque produit; elle est actuellement rate-limitée mais retourne l’existence du compte.

## Observabilité

- Sentry pour les erreurs client/serveur
- logging structuré et redaction légère dans `src/lib/logger.ts`
- Vercel Analytics et Speed Insights intégrés dans `app/layout.tsx`

## Notes

- le code actif vit désormais à la racine
- les anciens dossiers `frontend/` et `backend/` sont archivés dans `archive/`
- les tests legacy archivés ne font plus partie du périmètre de validation V1
